import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.agent.case_analyzer import MultimodalCaseAnalyzer
from app.agent.researcher import LegalResearchAgent, run_legal_research
from app.agent.tools import search_legal_knowledge_base
from app.auth.dependencies import get_optional_user
from app.config import Settings, get_settings
from app.db.database import get_db
from app.db.models import User, UserAuditLog
from app.models.schemas import (
    LegalQueryRequest,
    LegalQueryResponse,
    LegalSearchRequest,
    LegalSearchResponse,
    SearchResultItem,
    VectorstoreStatsResponse,
)
from app.rag.vectorstore import get_vectorstore_stats

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/legal", tags=["Legal Research"])


@router.post(
    "/query",
    response_model=LegalQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Research a legal situation or query",
    description=(
        "Analyzes a factual legal situation or question by searching the official BNS, BNSS, "
        "and BSA statutes, synthesizing a grounded research response with statutory citations, "
        "extracted provisions, and confidence metrics."
    ),
)
async def query_legal_assistant(
    payload: LegalQueryRequest,
    settings: Settings = Depends(get_settings),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> LegalQueryResponse:
    """Execute AI Legal Research Assistant query against BNS, BNSS, and BSA statutes."""
    if not payload.question or not payload.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The 'question' field must contain a non-empty string.",
        )

    # Check API key configuration early
    effective_api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not effective_api_key or effective_api_key.strip() == "your_gemini_api_key_here":
        logger.error("GEMINI_API_KEY is not configured in backend environment.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Gemini API key is not configured on the server. "
                "Please set GEMINI_API_KEY in the environment."
            ),
        )

    target_act = None
    if payload.act_filter and payload.act_filter.strip():
        norm_act = payload.act_filter.strip().upper()
        if norm_act not in ("BNS", "BNSS", "BSA"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid act_filter '{payload.act_filter}'. Allowed values are 'BNS', 'BNSS', or 'BSA'.",
            )
        target_act = norm_act

    # Determine user persona from authenticated profile or payload override
    user_type = payload.user_type
    purpose = payload.purpose
    user_id = None

    if current_user:
        user_id = current_user.id
        if current_user.profile and not user_type:
            user_type = current_user.profile.user_type
        if current_user.profile and not purpose:
            purpose = current_user.profile.purpose

    try:
        agent = LegalResearchAgent(
            top_k=payload.top_k or 8,
            gemini_model=settings.GEMINI_MODEL or os.getenv("GEMINI_MODEL"),
            gemini_api_key=effective_api_key,
        )
        result = agent.research(
            question=payload.question.strip(),
            top_k=payload.top_k,
            act_filter=target_act,
            user_type=user_type,
            purpose=purpose,
        )

        # Audit log for queries
        try:
            event_type = "GUARDRAIL_BLOCKED" if result.get("is_guardrail_blocked") else "QUERY"
            audit = UserAuditLog(
                user_id=user_id,
                event_type=event_type,
                query_text=payload.question.strip()[:500],
                guardrail_reason=result.get("why_they_may_apply") if result.get("is_guardrail_blocked") else None,
            )
            db.add(audit)
            db.commit()
        except Exception as audit_err:
            logger.debug(f"Audit log non-fatal error: {audit_err}")

        return LegalQueryResponse(**result)

    except ValueError as ve:
        logger.warning(f"Validation error during query execution: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except RuntimeError as re:
        err_msg = str(re)
        logger.error(f"Runtime error during legal research: {err_msg}")
        if "API_KEY" in err_msg.upper() or "GEMINI" in err_msg.upper() or "QUOTA" in err_msg.upper():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"LLM synthesis service temporarily unavailable ({err_msg}). Please verify API configuration or try again shortly.",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Legal research execution encountered an error: {err_msg}",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error during legal query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while processing your legal query: {str(e)}",
        )


@router.post(
    "/search",
    response_model=LegalSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Direct semantic search across statutory knowledge base",
    description="Performs Act-aware semantic similarity search directly against ChromaDB without invoking LLM synthesis.",
)
async def search_legal_statutes(
    payload: LegalSearchRequest,
    settings: Settings = Depends(get_settings),
) -> LegalSearchResponse:
    """Retrieve raw statutory passages and distance scores from the vectorstore."""
    if not payload.query or not payload.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The 'query' field must contain a non-empty search phrase.",
        )

    target_act = None
    if payload.act and payload.act.strip():
        norm_act = payload.act.strip().upper()
        if norm_act not in ("BNS", "BNSS", "BSA"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid act filter '{payload.act}'. Allowed values are 'BNS', 'BNSS', or 'BSA'.",
            )
        target_act = norm_act

    try:
        raw_chunks = search_legal_knowledge_base(
            query=payload.query.strip(),
            top_k=payload.k or 8,
            act_filter=target_act,
        )

        results = [
            SearchResultItem(
                content=chunk.get("content", ""),
                source=chunk.get("source", ""),
                page=chunk.get("page", 0),
                chunk_id=chunk.get("chunk_id", ""),
                score=float(chunk.get("score", chunk.get("distance_score", 0.0))),
                act=chunk.get("act", ""),
            )
            for chunk in raw_chunks
        ]

        return LegalSearchResponse(
            query=payload.query.strip(),
            total_results=len(results),
            results=results,
        )
    except Exception as e:
        logger.error(f"Error during statutory search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )


@router.get(
    "/stats",
    response_model=VectorstoreStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get legal knowledge base statistics",
    description="Returns metadata, chunk counts, and source document breakdown from ChromaDB.",
)
async def get_knowledge_base_stats(
    settings: Settings = Depends(get_settings),
) -> VectorstoreStatsResponse:
    """Returns vectorstore chunk count and indexed document breakdown."""
    stats = get_vectorstore_stats()
    return VectorstoreStatsResponse(
        collection_name=str(stats.get("collection_name", settings.CHROMA_COLLECTION_NAME)),
        persist_directory=str(stats.get("persist_directory", settings.CHROMA_PERSIST_DIRECTORY)),
        total_documents=int(stats.get("total_documents", 0)),
        sources=dict(stats.get("sources", {})),
        status=str(stats.get("status", "unknown")),
    )


@router.post(
    "/analyze-case",
    response_model=LegalQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Multimodal Case File & Evidence Analysis",
    description="Analyzes uploaded case documents (PDF, DOCX, TXT), photos, audio recordings, and video clips, extracting facts and researching grounded BNS/BNSS/BSA provisions.",
)
async def analyze_multimodal_case(
    case_notes: Optional[str] = Form(None),
    user_type: Optional[str] = Form(None),
    purpose: Optional[str] = Form(None),
    act_filter: Optional[str] = Form(None),
    top_k: int = Form(8),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    settings: Settings = Depends(get_settings),
) -> LegalQueryResponse:
    """Processes uploaded case files and media to produce a grounded legal analysis."""
    if not settings.GEMINI_API_KEY or not settings.GEMINI_API_KEY.strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key is not configured on the server.",
        )

    processed_files = []
    for f in files:
        if f.filename:
            content = await f.read()
            processed_files.append({
                "filename": f.filename,
                "content_type": f.content_type or "application/octet-stream",
                "bytes": content,
            })

    if not case_notes and not processed_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide case notes or upload at least one case file (PDF/Image/Audio/Video).",
        )

    norm_act = None
    if act_filter and act_filter.strip():
        norm_act = act_filter.strip().upper()
        if norm_act not in ("BNS", "BNSS", "BSA"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid act_filter '{act_filter}'. Allowed values are 'BNS', 'BNSS', or 'BSA'.",
            )

    try:
        analyzer = MultimodalCaseAnalyzer(
            gemini_model=settings.GEMINI_MODEL,
            gemini_api_key=settings.GEMINI_API_KEY,
        )
        result = analyzer.analyze_case_evidence(
            case_notes=case_notes,
            files_data=processed_files,
            user_type=user_type,
            purpose=purpose,
            act_filter=norm_act,
            top_k=top_k,
        )

        return LegalQueryResponse(**result)

    except Exception as e:
        logger.exception(f"Error during multimodal case analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Case analysis failed: {str(e)}",
        )


@router.get(
    "/acts/{act_name}/pdf",
    summary="Get official Bare Act PDF",
    description="Streams the official Gazette Bare Act PDF (BNS, BNSS, or BSA).",
)
async def get_act_pdf(
    act_name: str,
    settings: Settings = Depends(get_settings),
):
    """Returns the official Bare Act PDF for in-browser viewing."""
    clean_act = act_name.upper().replace(".PDF", "").strip()
    if clean_act not in ("BNS", "BNSS", "BSA"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Act not found. Valid acts are BNS, BNSS, and BSA.",
        )

    data_dir = Path(settings.DATA_DIRECTORY).resolve()
    pdf_path = data_dir / f"{clean_act}.pdf"

    if not pdf_path.exists():
        # Fallback to local data dir
        pdf_path = Path("data") / f"{clean_act}.pdf"

    if not pdf_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bare Act PDF '{clean_act}.pdf' is not available on this server.",
        )

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=f"{clean_act}.pdf",
    )


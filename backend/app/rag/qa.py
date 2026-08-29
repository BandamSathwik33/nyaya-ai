"""Question-Answering and RAG reasoning module for NyayaAI.

This module combines semantic legal retrieval with Google Gemini LLM reasoning to
deliver structured, grounded answers backed by statutory citations from BNS, BNSS, and BSA.
"""

import logging
import os
import time
from typing import Any, Dict, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)

LEGAL_DISCLAIMER = (
    "DISCLAIMER: NyayaAI provides automated legal information based on official Indian "
    "statutes (Bharatiya Nyaya Sanhita, Bharatiya Nagarik Suraksha Sanhita, and Bharatiya "
    "Sakshya Adhiniyam). This is for educational and informational purposes only and does "
    "not constitute legal advice. It is not a substitute for advice from a qualified lawyer "
    "or legal professional."
)

from app.config import get_settings
from app.rag.retriever import retrieve_legal_context



def _build_persona_system_prompt(user_type: Optional[str] = None, purpose: Optional[str] = None) -> str:
    """Builds a persona-adapted system prompt based on user role and research purpose."""
    base_instructions = """You are NyayaAI, an authoritative and precise AI legal assistant specialized in Indian Criminal Law:
1. Bharatiya Nyaya Sanhita, 2023 (BNS) - Substantive criminal offences, definitions, and punishments.
2. Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) - Criminal procedure, investigation, FIR, arrest, and bail.
3. Bharatiya Sakshya Adhiniyam, 2023 (BSA) - Evidence, admissibility, burden of proof, and electronic records.

CRITICAL INSTRUCTIONS & GROUNDING RULES:
1. Grounding: You MUST answer the question ONLY and STRICTLY based on the provided Legal Context passages.
2. No Inventions: Never invent or extrapolate legal sections, punishments, procedures, or case law.
3. Act Distinction: Accurately distinguish whether a rule belongs to BNS (substantive law), BNSS (procedure), or BSA (evidence).
4. Anti-Criminality Policy: Never assist in committing, facilitating, or evading crimes, nor advise on loophole exploitation or evidence destruction.
5. Traceable Citations: Every important legal claim must cite the Act name, section number (if present in context), page number, and source PDF.
"""

    persona_focus = ""
    ut = (user_type or "citizen_general").lower()
    purp = (purpose or "general_awareness").lower()

    if "victim" in ut or "complainant" in ut or "remedy" in purp or "report" in purp:
        persona_focus = (
            "\nUSER PROFILE: Victim / Complainant seeking legal remedy.\n"
            "TONE & EMPHASIS:\n"
            "- Prioritize immediate safety, citizen rights, and clear, actionable steps.\n"
            "- Explain how to lodge an FIR under Section 173 BNSS, approach the Police Station / Magistrate, and preserve digital/physical evidence.\n"
            "- Avoid overwhelming academic jargon; provide compassionate, direct, and structured legal empowerment.\n"
        )
    elif "advocate" in ut or "lawyer" in ut or "practitioner" in ut or "case" in purp:
        persona_focus = (
            "\nUSER PROFILE: Legal Advocate / Practitioner preparing legal matters.\n"
            "TONE & EMPHASIS:\n"
            "- Provide in-depth statutory cross-referencing between BNS offences, BNSS procedural safeguards, and BSA evidentiary rules.\n"
            "- Highlight burden of proof standards, statutory exceptions, procedural non-compliance consequences, and drafting elements.\n"
        )
    elif "student" in ut or "researcher" in ut or "academic" in purp:
        persona_focus = (
            "\nUSER PROFILE: Law Student / Legal Academic Researcher.\n"
            "TONE & EMPHASIS:\n"
            "- Provide analytical depth, conceptual foundations, and highlight the structural evolution from the old IPC/CrPC/IEA to the new BNS/BNSS/BSA framework.\n"
        )
    else:
        persona_focus = (
            "\nUSER PROFILE: Citizen / General User seeking legal awareness.\n"
            "TONE & EMPHASIS:\n"
            "- Explain rights and statutory definitions in lucid, accessible English with clear practical examples.\n"
        )

    format_instructions = """
REQUIRED ANSWER FORMAT:
You MUST structure your response using the following headers:

### 1. Direct Answer
[Concise summary directly addressing the question based on the retrieved legal context]

### 2. Potentially Relevant Provision(s)
[List specific sections and Acts found in the context]

### 3. Why It May Apply
[Explain the legal elements and how they connect to the query scenario]

### 4. Punishment / Procedure
[State the exact statutory punishment or procedural steps, strictly only when supported by the retrieved context]

### 5. Important Exceptions or Related Provisions
[Mention exceptions, provisos, compounding rules, or related definitions found in context]

### 6. Additional Facts Needed
[List the specific factual or evidentiary details needed to make a conclusive legal determination without guessing]

### 7. Sources
[Summary list of cited source statutory provisions, section numbers, pages, and official Act PDF filenames. Format strictly as clean bullet points: "• [Act Name] ([File.pdf]), Section [X], Page [Y]". DO NOT include any internal chunk IDs, hash keys, or vector identifiers.]

### 8. Disclaimer
[Informational disclaimer stating this is not formal legal counsel]
"""
    return base_instructions + persona_focus + format_instructions


def _format_context_for_prompt(chunks: List[Dict[str, Any]]) -> str:
    """Formats retrieved legal chunks into an organized context block for the LLM."""
    context_blocks = []
    for idx, chunk in enumerate(chunks, start=1):
        act = chunk.get("act", "Unknown Act")
        source = chunk.get("source", "Unknown Source")
        page = chunk.get("page", "N/A")
        content = chunk.get("content", "").strip()

        block = (
            f"[DOCUMENT {idx}]\n"
            f"Act: {act}\n"
            f"Source File: {source}\n"
            f"Page: {page}\n"
            f"Text:\n{content}\n"
        )
        context_blocks.append(block)

    return "\n" + ("=" * 60) + "\n" + "\n".join(context_blocks) + "\n" + ("=" * 60) + "\n"


def calculate_retrieval_confidence(chunks: List[Dict[str, Any]]) -> str:
    """Deterministically calculates confidence level based on ChromaDB distance scores.
    
    Returns:
        "HIGH" | "MEDIUM" | "LOW"
    """
    if not chunks:
        return "LOW"

    settings = get_settings()
    high_threshold = getattr(settings, "CONFIDENCE_HIGH_THRESHOLD", 0.85)
    med_threshold = getattr(settings, "CONFIDENCE_MEDIUM_THRESHOLD", 1.15)

    scores = [float(c.get("score", c.get("distance_score", 2.0))) for c in chunks]
    best_score = min(scores)
    top3_avg = sum(sorted(scores)[:3]) / min(3, len(scores))

    # Strict deterministic evaluation
    if best_score <= high_threshold and top3_avg <= (high_threshold + 0.15):
        return "HIGH"
    elif best_score <= med_threshold:
        return "MEDIUM"
    else:
        return "LOW"


_QA_RESPONSE_CACHE: Dict[str, Dict[str, Any]] = {}
_QA_CACHE_MAX_SIZE = 100

def answer_legal_question(
    question: str,
    top_k: int = 8,
    act: Optional[str] = None,
    act_filter: Optional[str] = None,
    user_type: Optional[str] = None,
    purpose: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
    gemini_model: Optional[str] = None,
) -> Dict[str, Any]:
    """Answers a user's legal question using fast grounded Retrieval-Augmented Generation."""
    if not question or not question.strip():
        raise ValueError("Legal question cannot be empty.")

    clean_question = question.strip()
    target_act = act or act_filter

    # Check in-memory answer cache for identical inquiry
    cache_key = f"{clean_question.lower()}::{target_act}::{user_type}::{purpose}"
    if cache_key in _QA_RESPONSE_CACHE:
        logger.info(f"Serving cached legal research for query: '{clean_question[:50]}...'")
        return _QA_RESPONSE_CACHE[cache_key]

    # Step 0: Anti-Criminal Intent & Evasion Guardrail Inspection
    from app.agent.guardrails import inspect_criminal_intent, generate_guardrail_refusal_response
    is_blocked, violation_reason = inspect_criminal_intent(clean_question)
    if is_blocked and violation_reason:
        logger.warning(f"Criminal intent guardrail triggered: {violation_reason}")
        return generate_guardrail_refusal_response(clean_question, violation_reason)

    logger.info(f"Processing legal question: '{clean_question}' (top_k={top_k}, act={target_act}, user_type={user_type})")

    # Step 1: Retrieve Legal Context
    try:
        retrieved_chunks = retrieve_legal_context(
            query=clean_question,
            k=top_k,
            act=target_act,
        )
    except Exception as e:
        logger.error(f"Error during context retrieval: {e}")
        raise RuntimeError(f"Context retrieval failed: {e}") from e

    # Step 2: Deterministic Confidence Calculation
    confidence = calculate_retrieval_confidence(retrieved_chunks)

    # Format source references for response
    sources_summary = [
        {
            "act": str(chunk.get("act", "")),
            "source": str(chunk.get("source", "")),
            "page": chunk.get("page", 0),
            "chunk_id": str(chunk.get("chunk_id", "")),
            "score": float(chunk.get("score", chunk.get("distance_score", 0.0))),
        }
        for chunk in retrieved_chunks
    ]

    if not retrieved_chunks:
        return {
            "question": clean_question,
            "answer": (
                "### 1. Direct Answer\n"
                "Based on the available legal documents in the knowledge base, there is "
                "insufficient information to answer this question.\n\n"
                "### 8. Disclaimer\n"
                f"{LEGAL_DISCLAIMER}"
            ),
            "sources": [],
            "confidence": "LOW",
            "disclaimer": LEGAL_DISCLAIMER,
        }

    # Step 3: Validate API Key for LLM Generation
    settings = get_settings()
    api_key = gemini_api_key or os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
    model_name = gemini_model or os.getenv("GEMINI_MODEL") or settings.GEMINI_MODEL or "gemini-2.5-flash"

    if not api_key or not api_key.strip() or api_key.strip() == "your_gemini_api_key_here":
        raise ValueError(
            "GEMINI_API_KEY is not configured in backend/.env. "
            "Please set a valid Gemini API key for answer generation."
        )

    # Step 4: Format Context and Persona System Prompt
    context_text = _format_context_for_prompt(retrieved_chunks)
    persona_system_prompt = _build_persona_system_prompt(user_type=user_type, purpose=purpose)
    user_prompt = (
        f"OFFICIAL STATUTORY CONTEXT EXCERPTS:\n{context_text}\n\n"
        f"USER QUESTION / SCENARIO:\n{clean_question}\n\n"
        "Provide a comprehensive, accurate, and clearly structured legal answer adhering strictly "
        "to the 8-part format and grounding guidelines tailored to the user profile."
    )

    # Step 5: Invoke Gemini LLM with automatic retry for rate limits
    llm_kwargs: Dict[str, Any] = {
        "model": model_name,
        "google_api_key": api_key.strip(),
    }
    # Only supply temperature if not fixed-defaults model
    if "flash" not in model_name.lower() or "gemini-1.5" in model_name.lower():
        llm_kwargs["temperature"] = 0.1

    llm = ChatGoogleGenerativeAI(**llm_kwargs)

    messages = [
        SystemMessage(content=persona_system_prompt),
        HumanMessage(content=user_prompt),
    ]

    max_retries = 5
    response = None
    for attempt in range(max_retries):
        try:
            logger.info(f"Invoking LLM ({model_name}) for grounded legal synthesis (attempt {attempt + 1}/{max_retries})...")
            response = llm.invoke(messages)
            break
        except Exception as e:
            err_str = str(e)
            if ("429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower()) and attempt < max_retries - 1:
                cooldown = 20 * (attempt + 1)
                # Parse retry delay if provided by Google API
                if "retry in " in err_str:
                    try:
                        delay_part = err_str.split("retry in ")[1].split("s")[0].strip()
                        cooldown = max(int(float(delay_part)) + 3, cooldown)
                    except Exception:
                        pass
                elif "retryDelay" in err_str:
                    try:
                        delay_part = err_str.split("retryDelay': '")[1].split("s'")[0].strip()
                        cooldown = max(int(float(delay_part)) + 3, cooldown)
                    except Exception:
                        pass
                logger.warning(f"Gemini rate limit encountered. Cooldown for {cooldown}s before retry {attempt + 2}/{max_retries}...")
                time.sleep(cooldown)
            else:
                logger.error(f"Gemini LLM generation failed: {e}")
                raise RuntimeError(f"Failed to generate legal answer: {e}") from e

    # Safely convert response content to string
    if hasattr(response, "content"):
        if isinstance(response.content, list):
            answer_text = "".join(
                part if isinstance(part, str) else (part.get("text", "") if isinstance(part, dict) else str(part))
                for part in response.content
            )
        else:
            answer_text = str(response.content)
    else:
        answer_text = str(response)

    result = {
        "question": clean_question,
        "answer": answer_text.strip(),
        "sources": sources_summary,
        "confidence": confidence,
        "disclaimer": LEGAL_DISCLAIMER,
    }

    if len(_QA_RESPONSE_CACHE) >= _QA_CACHE_MAX_SIZE:
        _QA_RESPONSE_CACHE.pop(next(iter(_QA_RESPONSE_CACHE)))
    _QA_RESPONSE_CACHE[cache_key] = result

    return result

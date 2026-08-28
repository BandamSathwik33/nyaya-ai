"""Multimodal Case File & Evidence Analyzer for NyayaAI.

This module processes uploaded case files (PDF, DOCX, TXT), evidence photos (JPG, PNG, WEBP),
voice/audio recordings (MP3, WAV, WebM, M4A), and video clips (MP4, WebM), extracting
factual chronologies and evidence details, and cross-referencing codified BNS, BNSS, and BSA statutes.
"""

import base64
import io
import logging
import os
import time
from typing import Any, Dict, List, Optional

import google.generativeai as genai
from app.config import get_settings
from app.rag.qa import answer_legal_question
from app.rag.retriever import retrieve_legal_context

logger = logging.getLogger(__name__)


class MultimodalCaseAnalyzer:
    """Processes multimodal case evidence and synthesizes persona-grounded legal research."""

    def __init__(
        self,
        gemini_model: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
    ):
        settings = get_settings()
        self.api_key = gemini_api_key or os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        self.model_name = gemini_model or os.getenv("GEMINI_MODEL") or settings.GEMINI_MODEL
        if self.api_key:
            genai.configure(api_key=self.api_key.strip())

    def analyze_case_evidence(
        self,
        case_notes: Optional[str] = None,
        files_data: Optional[List[Dict[str, Any]]] = None,
        user_type: Optional[str] = None,
        purpose: Optional[str] = None,
        act_filter: Optional[str] = None,
        top_k: int = 8,
    ) -> Dict[str, Any]:
        """Analyzes uploaded documents, images, audio, and video files to generate statutory legal research.
        
        Args:
            case_notes: Optional user-written notes, narration, or specific legal questions.
            files_data: List of dicts containing:
                        - 'filename': str
                        - 'content_type': str (e.g. 'application/pdf', 'image/png', 'audio/mp3', 'video/mp4')
                        - 'bytes': bytes
            user_type: Persona identifier ('advocate', 'complainant_victim', 'police_officer', 'citizen_general').
            purpose: Research intent ('case_preparation', 'fir_registration', 'evidence_admissibility').
            act_filter: Optional specific Act restriction ('BNS', 'BNSS', 'BSA').
            top_k: Number of statutory chunks to retrieve.

        Returns:
            Structured research dictionary with evidence breakdown and grounded statutory analysis.
        """
        start_time = time.time()
        files_data = files_data or []

        if not case_notes and not files_data:
            raise ValueError("Please provide case notes or upload at least one case document, image, audio, or video file.")

        logger.info(f"Analyzing case with {len(files_data)} attached file(s). User type: {user_type}")

        # 1. Prepare multimodal content parts for Gemini
        prompt_parts: List[Any] = []

        extraction_instructions = """You are an expert Indian Criminal Law Evidence & Case Analyst for NyayaAI.
Carefully review all attached case documents, photographs/screenshots, audio recordings, or video evidence, along with the user's case notes.

YOUR OBJECTIVE:
1. Extract the comprehensive factual narrative and chronology of the incident.
2. Identify all parties involved (Victim, Accused, Complainant, Witnesses, Officials).
3. Catalog specific evidentiary facts discovered in the files (physical injuries, property details, written communications, digital records, audio statements, visual observations, dates, times, locations).
4. Formulate the core legal questions under Indian Criminal Law:
   - Bharatiya Nyaya Sanhita, 2023 (BNS): Substantive offences committed, definitions, and punishments.
   - Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS): Procedural remedies, FIR registration, arrest rules, bail, and investigation protocol.
   - Bharatiya Sakshya Adhiniyam, 2023 (BSA): Admissibility of the uploaded evidence, digital certificates under Section 63, electronic records, and burden of proof.

Synthesize a comprehensive, coherent summary of the case scenario and exact legal questions to research against the codified statutes.
"""
        prompt_parts.append(extraction_instructions)

        if case_notes and case_notes.strip():
            prompt_parts.append(f"\nUSER CASE NOTES / NARRATION:\n{case_notes.strip()}\n")

        # Attach each media / document file
        for idx, file_item in enumerate(files_data, start=1):
            fname = file_item.get("filename", f"file_{idx}")
            mime_type = file_item.get("content_type", "application/octet-stream").lower()
            file_bytes = file_item.get("bytes", b"")

            if not file_bytes:
                continue

            # Text or document formats
            if "text/" in mime_type or fname.endswith((".txt", ".csv", ".json")):
                try:
                    text_content = file_bytes.decode("utf-8", errors="ignore")
                    prompt_parts.append(f"\n[ATTACHMENT {idx}: {fname} (Text Document)]\n{text_content}\n")
                    continue
                except Exception:
                    pass

            # PDF Extraction (PyMuPDF)
            if "pdf" in mime_type or fname.lower().endswith(".pdf"):
                try:
                    import pymupdf
                    doc = pymupdf.open(stream=file_bytes, filetype="pdf")
                    pdf_text = "\n".join([page.get_text() for page in doc])
                    if pdf_text.strip():
                        prompt_parts.append(f"\n[ATTACHMENT {idx}: {fname} (PDF Case Document)]\n{pdf_text[:15000]}\n")
                        continue
                except Exception as pdf_err:
                    logger.warning(f"Could not extract text from PDF {fname}: {pdf_err}")

            # Images, Audio, Video, and Native Binary parts for Gemini
            valid_gemini_mime = (
                mime_type.startswith("image/")
                or mime_type.startswith("audio/")
                or mime_type.startswith("video/")
                or mime_type == "application/pdf"
            )

            if valid_gemini_mime:
                prompt_parts.append(f"\n[ATTACHMENT {idx}: {fname} ({mime_type})]")
                prompt_parts.append({
                    "mime_type": mime_type,
                    "data": file_bytes,
                })
            else:
                prompt_parts.append(f"\n[ATTACHMENT {idx}: {fname} (Attached binary document)]\n")

        prompt_parts.append("\nPlease output the extracted Case Summary, Evidence Catalog, and Formulated Legal Research Query.")

        # 2. Extract synthesized scenario using Gemini
        try:
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt_parts)
            extracted_case_summary = response.text if response and response.text else (case_notes or "Case evidence submitted.")
        except Exception as gemini_err:
            logger.error(f"Multimodal evidence extraction failed: {gemini_err}")
            extracted_case_summary = case_notes or "Case evidence analysis based on submitted documents."

        logger.info(f"Extracted case factual scenario: {extracted_case_summary[:200]}...")

        # 3. Grounded Legal Retrieval & Synthesis across BNS, BNSS, and BSA
        full_query = f"{case_notes or ''}\n\nEVIDENCE & CASE FACTS:\n{extracted_case_summary}"
        legal_result = answer_legal_question(
            question=full_query.strip()[:4000],
            top_k=top_k,
            act_filter=act_filter,
            user_type=user_type,
            purpose=purpose,
            gemini_model=self.model_name,
            gemini_api_key=self.api_key,
        )

        # Enrich response with multimodal metadata
        legal_result["case_summary"] = extracted_case_summary
        legal_result["attached_files_count"] = len(files_data)
        legal_result["attached_filenames"] = [f.get("filename", "") for f in files_data]
        legal_result["analysis_duration_seconds"] = round(time.time() - start_time, 2)

        return legal_result


def analyze_uploaded_case(
    case_notes: Optional[str] = None,
    files_data: Optional[List[Dict[str, Any]]] = None,
    user_type: Optional[str] = None,
    purpose: Optional[str] = None,
    act_filter: Optional[str] = None,
    top_k: int = 8,
) -> Dict[str, Any]:
    """Convenience helper to analyze multimodal case evidence."""
    analyzer = MultimodalCaseAnalyzer()
    return analyzer.analyze_case_evidence(
        case_notes=case_notes,
        files_data=files_data,
        user_type=user_type,
        purpose=purpose,
        act_filter=act_filter,
        top_k=top_k,
    )

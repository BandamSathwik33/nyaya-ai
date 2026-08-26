"""AI Legal Research Agent for NyayaAI.

This module implements the autonomous legal research workflow:
1. Understand the user's factual scenario or legal question.
2. Identify relevant legal concepts, statutory domains, and primary Acts (BNS, BNSS, BSA).
3. Search and retrieve grounded statutory passages from ChromaDB.
4. Synthesize an authoritative, grounded analysis backed strictly by retrieved provisions.
5. Extract structured provisions, applicability reasons, missing facts, and citations.
"""

import logging
from typing import Any, Dict, List, Optional

from app.agent.tools import (
    extract_key_legal_concepts,
    parse_structured_sections,
    search_legal_knowledge_base,
)
from app.config import get_settings
from app.rag.qa import LEGAL_DISCLAIMER, answer_legal_question

logger = logging.getLogger(__name__)


class LegalResearchAgent:
    """Autonomous AI Legal Research Assistant grounded on BNS, BNSS, and BSA statutes."""

    def __init__(
        self,
        top_k: int = 8,
        gemini_model: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
    ):
        self.top_k = top_k
        self.gemini_model = gemini_model
        self.gemini_api_key = gemini_api_key

    def research(
        self,
        question: str,
        top_k: Optional[int] = None,
        act_filter: Optional[str] = None,
        user_type: Optional[str] = None,
        purpose: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Executes the end-to-end legal research workflow."""
        if not question or not question.strip():
            raise ValueError("Legal research scenario cannot be empty.")

        clean_question = question.strip()
        effective_k = top_k or self.top_k

        # Diagnostic Log: Incoming Query & Analysis
        concepts = extract_key_legal_concepts(clean_question)
        logger.info(
            f"[Agent Step 1] Query: '{clean_question}' | Detected Act Intent: {concepts['inferred_act']} | "
            f"Keywords: {concepts['keywords']} | Act Filter: {act_filter} | Persona: {user_type}"
        )

        # Diagnostic Log: Retrieval
        logger.info(
            f"[Agent Step 2] Executing retrieval (k={effective_k}, filter={act_filter or concepts['inferred_act']})..."
        )
        rag_result = answer_legal_question(
            question=clean_question,
            top_k=effective_k,
            act_filter=act_filter,
            user_type=user_type,
            purpose=purpose,
            gemini_api_key=self.gemini_api_key,
            gemini_model=self.gemini_model,
        )

        # If guardrail blocked, return refusal directly
        if rag_result.get("is_guardrail_blocked"):
            return rag_result

        sources = rag_result.get("sources", [])
        logger.info(f"[Agent Step 3] Retrieved {len(sources)} source passage(s) from knowledge base.")
        for idx, src in enumerate(sources[:2], start=1):
            logger.info(
                f"  Sample Chunk {idx}: Act={src.get('act')}, Page={src.get('page')}, "
                f"Score={src.get('score')}, ChunkID={src.get('chunk_id')}"
            )

        # Diagnostic Log: Response Synthesis & Structuring
        raw_answer = rag_result.get("answer", "")
        logger.info(f"[Agent Step 4] LLM synthesis completed ({len(raw_answer)} chars). Parsing structured sections...")
        parsed_components = parse_structured_sections(raw_answer)

        # Build clean provisions list
        relevant_provisions = parsed_components.get("relevant_provisions", [])
        
        # Fallback to source citations if no markdown provisions were parsed
        if not relevant_provisions and sources:
            seen_acts = set()
            for src in sources:
                act_name = src.get("act", "Statutory Act")
                if act_name not in seen_acts:
                    seen_acts.add(act_name)
                    relevant_provisions.append({
                        "act": act_name,
                        "section_or_topic": f"{act_name} Statutory Provisions (Page {src.get('page', 'N/A')})",
                        "description": f"Retrieved from {src.get('source', 'Statute')} regarding the scenario.",
                        "relevance_reason": "Statutory context identified during semantic search.",
                    })

        why_may_apply = parsed_components.get("why_they_may_apply")
        if not why_may_apply:
            why_may_apply = "Please refer to the comprehensive answer section for detailed legal reasoning."

        additional_facts = parsed_components.get("additional_facts_needed", [])
        if not additional_facts:
            additional_facts = [
                "Specific sequence, dates, and times of the alleged events.",
                "Exact nature of threat, demand, or communication (written, oral, electronic).",
                "Witness testimony or supporting corroborative records."
            ]

        confidence = rag_result.get("confidence", "MEDIUM")

        logger.info(
            f"[Agent Step 5] Result structured: Confidence={confidence}, "
            f"Provisions={len(relevant_provisions)}, Sources={len(sources)}, "
            f"FactsNeeded={len(additional_facts)}"
        )

        return {
            "question": clean_question,
            "answer": raw_answer,
            "relevant_provisions": relevant_provisions,
            "why_they_may_apply": why_may_apply,
            "additional_facts_needed": additional_facts,
            "sources": sources,
            "confidence": confidence,
            "disclaimer": LEGAL_DISCLAIMER,
        }


def run_legal_research(
    question: str,
    top_k: int = 8,
    act_filter: Optional[str] = None,
    user_type: Optional[str] = None,
    purpose: Optional[str] = None,
) -> Dict[str, Any]:
    """Helper functional interface to execute legal research agent."""
    agent = LegalResearchAgent(top_k=top_k)
    return agent.research(
        question=question,
        top_k=top_k,
        act_filter=act_filter,
        user_type=user_type,
        purpose=purpose,
    )

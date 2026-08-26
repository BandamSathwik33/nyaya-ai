"""Reusable research tools for the NyayaAI Legal Research Agent.

These tools provide modular access to semantic search across BNS, BNSS, and BSA
statutory collections, context analysis, and factual element extraction.
"""

import logging
import re
from typing import Any, Dict, List, Optional

from app.rag.retriever import detect_intended_act, retrieve_legal_context

logger = logging.getLogger(__name__)


def search_legal_knowledge_base(
    query: str,
    top_k: int = 8,
    act_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Tool: Searches the ChromaDB legal knowledge base for relevant statutory chunks.
    
    Args:
        query: Natural language query or factual scenario.
        top_k: Number of relevant passages to retrieve.
        act_filter: Optional Act constraint (BNS, BNSS, BSA).
        
    Returns:
        List of retrieved chunk dictionaries containing content, source, page, chunk_id, score, act.
    """
    if not query or not query.strip():
        raise ValueError("Search query cannot be empty.")
        
    return retrieve_legal_context(
        query=query.strip(),
        k=top_k,
        act=act_filter,
    )


def extract_key_legal_concepts(situation: str) -> Dict[str, Any]:
    """Tool: Analyzes factual situation to extract key concepts, intent, and primary Act."""
    inferred_act = detect_intended_act(situation)
    
    words = re.findall(r"\b[a-zA-Z]{3,}\b", situation.lower())
    stop_words = {"the", "and", "what", "can", "for", "with", "this", "that", "from", "person", "someone", "about"}
    keywords = [w for w in words if w not in stop_words][:10]
    
    return {
        "inferred_act": inferred_act,
        "keywords": keywords,
        "situation_length": len(situation),
    }


def clean_markdown_text(text: str) -> str:
    """Removes markdown bold, italic, and bullet characters from text."""
    t = text.strip()
    t = re.sub(r"^[\*\-\d\.\s]+", "", t)
    t = t.replace("**", "").replace("*", "").replace("__", "").replace("`", "")
    return t.strip()


def parse_structured_sections(answer_text: str) -> Dict[str, Any]:
    """Helper: Robustly extracts structured components from markdown-formatted legal answer text."""
    sections = {
        "direct_answer": "",
        "relevant_provisions": [],
        "why_they_may_apply": "",
        "additional_facts_needed": [],
        "punishment_or_procedure": "",
        "exceptions": "",
    }
    
    # Extract Why It May Apply
    why_match = re.search(
        r"###\s*3\.\s*Why\s*(?:It|They)\s*May\s*Apply\s*\n(.*?)(?=\n###|\Z)",
        answer_text,
        re.DOTALL | re.IGNORECASE,
    )
    if why_match:
        sections["why_they_may_apply"] = why_match.group(1).strip()
        
    # Extract Additional Facts Needed
    facts_match = re.search(
        r"###\s*6\.\s*Additional\s*Facts\s*Needed\s*\n(.*?)(?=\n###|\Z)",
        answer_text,
        re.DOTALL | re.IGNORECASE,
    )
    if facts_match:
        raw_facts = facts_match.group(1).strip()
        parsed_facts = []
        for line in raw_facts.split("\n"):
            cleaned = clean_markdown_text(line)
            if cleaned and len(cleaned) > 5 and not cleaned.startswith("###"):
                parsed_facts.append(cleaned)
        sections["additional_facts_needed"] = parsed_facts
        
    # Extract Potentially Relevant Provisions
    prov_match = re.search(
        r"###\s*2\.\s*Potentially\s*Relevant\s*Provision\(s\)\s*\n(.*?)(?=\n###|\Z)",
        answer_text,
        re.DOTALL | re.IGNORECASE,
    )
    if prov_match:
        raw_prov = prov_match.group(1).strip()
        current_act = "Bharatiya Nyaya Sanhita, 2023 (BNS)"
        parsed_provisions = []
        
        for line in raw_prov.split("\n"):
            raw_line = line.strip()
            if not raw_line or raw_line.startswith("---") or raw_line.startswith("###"):
                continue
                
            cleaned_line = clean_markdown_text(raw_line)
            if not cleaned_line:
                continue

            lower_cleaned = cleaned_line.lower()

            # Check if this line is just an Act category header (e.g. "Bharatiya Nyaya Sanhita, 2023 (BNS):")
            if "bharatiya nagarik suraksha" in lower_cleaned or lower_cleaned.endswith("bnss:"):
                current_act = "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)"
                if cleaned_line.endswith(":"):
                    continue
            elif "bharatiya sakshya" in lower_cleaned or lower_cleaned.endswith("bsa:"):
                current_act = "Bharatiya Sakshya Adhiniyam, 2023 (BSA)"
                if cleaned_line.endswith(":"):
                    continue
            elif "bharatiya nyaya" in lower_cleaned or lower_cleaned.endswith("bns:"):
                current_act = "Bharatiya Nyaya Sanhita, 2023 (BNS)"
                if cleaned_line.endswith(":"):
                    continue

            # Determine Act for this specific line if mentioned inline
            line_act = current_act
            if "bnss" in lower_cleaned or "nagarik suraksha" in lower_cleaned:
                line_act = "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)"
            elif "bsa" in lower_cleaned or "sakshya" in lower_cleaned:
                line_act = "Bharatiya Sakshya Adhiniyam, 2023 (BSA)"
            elif "bns" in lower_cleaned or "nyaya" in lower_cleaned:
                line_act = "Bharatiya Nyaya Sanhita, 2023 (BNS)"

            # Split by ':' or '-' to separate section header from description
            parts = re.split(r"[:–—\-]", cleaned_line, maxsplit=1)
            section_topic = parts[0].strip()
            description = parts[1].strip() if len(parts) > 1 else cleaned_line

            parsed_provisions.append({
                "act": line_act,
                "section_or_topic": section_topic,
                "description": description,
                "relevance_reason": "Identified in statutory context as relevant to the query scenario.",
            })

        sections["relevant_provisions"] = parsed_provisions

    return sections

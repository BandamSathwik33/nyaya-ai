"""AI Legal Research Agent module for NyayaAI."""

from app.agent.researcher import LegalResearchAgent, run_legal_research
from app.agent.tools import (
    extract_key_legal_concepts,
    parse_structured_sections,
    search_legal_knowledge_base,
)

__all__ = [
    "LegalResearchAgent",
    "run_legal_research",
    "search_legal_knowledge_base",
    "extract_key_legal_concepts",
    "parse_structured_sections",
]

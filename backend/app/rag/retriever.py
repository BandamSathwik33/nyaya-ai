"""Legal document retrieval module for NyayaAI.

This module is responsible strictly for semantic context retrieval from the
ChromaDB legal knowledge base. It provides Act-aware intelligent retrieval
and does NOT generate AI answers or invoke LLMs.
"""

import logging
import re
from typing import Any, Dict, List, Optional

from app.config import get_settings
from app.rag.embeddings import get_embedding_model
from app.rag.vectorstore import get_vectorstore

logger = logging.getLogger(__name__)

# Heuristic patterns to classify legal intent across the 3 criminal acts
_PROCEDURE_PATTERNS = re.compile(
    r"\b(fir|first information report|investigation|arrest|arrested|police|police custody|"
    r"remand|bail|anticipatory bail|magistrate|warrant|summons|charge sheet|chargesheet|"
    r"cognizable|non-cognizable|compounding|compoundable|trial procedure|inquiry|"
    r"search and seizure|seizure|proclamation|attachment|plea bargaining|committal|"
    r"jurisdiction of criminal court|maintenance|public nuisance|custodial death)\b",
    re.IGNORECASE,
)

_EVIDENCE_PATTERNS = re.compile(
    r"\b(evidence|prove|proof|proved|disproved|not proved|admissible|admissibility|"
    r"witness|witnesses|testimony|electronic record|digital record|electronic evidence|"
    r"primary evidence|secondary evidence|burden of proof|presumption|estoppel|"
    r"confession|dying declaration|fact in issue|relevant fact|relevancy|oral evidence|"
    r"documentary evidence|expert opinion|cross-examination|examination-in-chief|"
    r"re-examination|privileged communication|accomplice|hostile witness)\b",
    re.IGNORECASE,
)

_OFFENCE_PATTERNS = re.compile(
    r"\b(offence|offense|crime|punishment|penalty|liable to fine|imprisonment|"
    r"hurt|grievous hurt|injury|murder|culpable homicide|suicide|kidnapping|abduction|"
    r"theft|extortion|extort|robbery|dacoity|cheating|cheated|criminal breach of trust|mischief|"
    r"criminal trespass|house-breaking|forgery|defamation|rape|sexual assault|"
    r"criminal intimidation|threat|threatened|threatening|threats|demand|demanded|blackmail|"
    r"intimidate|intimidating|assault|harm|kill|insult|attempt|abetment|conspiracy|sedition|"
    r"terrorist act|snatching|organized crime|mob lynching|rash driving|negligence)\b",
    re.IGNORECASE,
)

_EXPANSION_MAP = {
    r"\bfir\b": "FIR information in cognizable cases Section 173",
    r"\bfirst information report\b": "information in cognizable cases Section 173",
    r"\bcharge ?sheet\b": "police report on completion of investigation",
    r"\banticipatory bail\b": "direction for grant of bail to person apprehending arrest",
    r"\bremand\b": "custody detention when investigation cannot be completed in twenty-four hours",
    r"\belectronic records?\b": "admissibility of electronic records semiconductor memory digital record Section 63",
}


def _expand_legal_query(query: str) -> str:
    """Expands colloquial Indian legal terminology with statutory Bare Act phrases."""
    expanded = query
    for pattern, expansion in _EXPANSION_MAP.items():
        if re.search(pattern, query, re.IGNORECASE):
            expanded += f" ({expansion})"
    return expanded


def detect_intended_act(query: str) -> Optional[str]:
    """Infers the most relevant Indian statutory Act based on query semantics.
    
    Returns:
        - "BNSS" for criminal procedure, police powers, arrest, FIR, bail, etc.
        - "BSA" for evidence, proof, admissibility, electronic records, etc.
        - "BNS" for substantive criminal offences, definitions, penalties.
        - None if query is generic, cross-cutting, or ambiguous.
    """
    q = query.strip().lower()

    # Direct Act name mentions
    if "bharatiya nagarik suraksha" in q or " bnss" in q or q.startswith("bnss"):
        return "BNSS"
    if "bharatiya sakshya" in q or " bsa" in q or q.startswith("bsa"):
        return "BSA"
    if "bharatiya nyaya" in q or " bns" in q or q.startswith("bns"):
        return "BNS"

    proc_matches = len(_PROCEDURE_PATTERNS.findall(q))
    evid_matches = len(_EVIDENCE_PATTERNS.findall(q))
    off_matches = len(_OFFENCE_PATTERNS.findall(q))

    counts = {"BNSS": proc_matches, "BSA": evid_matches, "BNS": off_matches}
    best_act, best_count = max(counts.items(), key=lambda x: x[1])

    if best_count > 0:
        # Check if one dominates clearly
        sorted_counts = sorted(counts.values(), reverse=True)
        if sorted_counts[0] > sorted_counts[1]:
            logger.info(f"Detected primary Act intent for query: '{best_act}' (score={best_count})")
            return best_act

    logger.info("No single Act dominated query semantics; searching across all acts.")
    return None


def retrieve_legal_context(
    query: str,
    k: int = 8,
    act: Optional[str] = None,
    act_filter: Optional[str] = None,
    collection_name: Optional[str] = None,
    persist_directory: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Performs Act-aware semantic similarity search against the ChromaDB legal knowledge base.
    
    Args:
        query: Natural language legal question or search phrase.
        k: Maximum number of relevant chunks to retrieve (default: 8).
        act: Optional filter to restrict/prioritize a specific Act:
             e.g. "BNS", "BNSS", "BSA" (or "BNS.pdf", etc.).
        act_filter: Alias for `act`.
        collection_name: Optional override for Chroma collection name.
        persist_directory: Optional override for Chroma storage directory.
        
    Returns:
        List of structured dictionaries containing:
            - content: Full text of the retrieved chunk.
            - source: PDF filename (e.g. "BNS.pdf").
            - page: Page number from the source PDF.
            - chunk_id: Unique deterministic chunk identifier.
            - score: ChromaDB similarity distance score (lower = closer match).
            - distance_score: Alias for `score`.
            - act: Derived document/act name (e.g. "BNS", "BNSS", "BSA").
            
    Raises:
        ValueError: If query is empty or invalid.
        RuntimeError: If vector store or embedding model fails to initialize.
    """
    if not query or not query.strip():
        raise ValueError("Search query cannot be empty.")

    clean_query = query.strip()
    search_query = _expand_legal_query(clean_query)
    explicit_act = act or act_filter
    inferred_act = detect_intended_act(clean_query) if not explicit_act else None
    target_act = explicit_act or inferred_act

    logger.info(
        f"Retrieving top-{k} legal contexts for: '{clean_query}' (search='{search_query}') "
        f"(explicit_act={explicit_act}, inferred_act={inferred_act})"
    )

    try:
        embeddings = get_embedding_model()
        vectorstore = get_vectorstore(
            embeddings=embeddings,
            collection_name=collection_name,
            persist_directory=persist_directory,
        )
    except Exception as e:
        logger.error(f"Failed to connect to vectorstore or initialize embeddings: {e}")
        raise RuntimeError(f"Knowledge base connection failed: {e}") from e

    results = []

    # 1. If an Act is explicitly requested by caller, filter strictly to that Act
    if explicit_act and explicit_act.strip():
        clean_target = explicit_act.strip().upper().replace(".PDF", "")
        source_name = f"{clean_target}.pdf"
        logger.info(f"Applying strict Act filter: {source_name}")
        try:
            results = vectorstore.similarity_search_with_score(
                query=search_query,
                k=k,
                filter={"source": source_name},
            )
        except Exception as e:
            logger.warning(f"Filtered search failed ({e}), falling back to global search...")
            results = vectorstore.similarity_search_with_score(query=search_query, k=k)

    # 2. If an Act was inferred automatically, perform Act-prioritized retrieval
    # Retrieve majority from inferred primary Act (e.g. top k-2), plus top chunks across all Acts
    elif inferred_act:
        primary_source = f"{inferred_act}.pdf"
        primary_k = max(int(k * 0.75), 1)
        general_k = k

        try:
            # Query primary act
            primary_results = vectorstore.similarity_search_with_score(
                query=search_query,
                k=primary_k,
                filter={"source": primary_source},
            )
        except Exception as e:
            logger.warning(f"Inferred Act search failed ({e}); falling back...")
            primary_results = []

        # Query all acts to guarantee broad coverage
        try:
            general_results = vectorstore.similarity_search_with_score(
                query=search_query,
                k=general_k,
            )
        except Exception as e:
            logger.error(f"Global similarity search failed: {e}")
            raise RuntimeError(f"Semantic retrieval failed: {e}") from e

        # Merge results, preserving highest relevance while ensuring primary Act representation
        seen_chunk_ids = set()
        merged_results = []

        # Add primary Act results first
        for doc, score in primary_results:
            cid = doc.metadata.get("chunk_id")
            if cid and cid not in seen_chunk_ids:
                seen_chunk_ids.add(cid)
                merged_results.append((doc, score))

        # Add general results
        for doc, score in general_results:
            cid = doc.metadata.get("chunk_id")
            if cid and cid not in seen_chunk_ids:
                seen_chunk_ids.add(cid)
                merged_results.append((doc, score))

        # Sort by distance score ascending (lower is better) and trim to top-k
        merged_results.sort(key=lambda x: x[1])
        results = merged_results[:k]

    # 3. Otherwise, search across all Acts uniformly
    else:
        try:
            results = vectorstore.similarity_search_with_score(
                query=search_query,
                k=k,
            )
        except Exception as e:
            logger.error(f"Similarity search failed: {e}")
            raise RuntimeError(f"Semantic retrieval failed: {e}") from e

    # Format structured output
    structured_results: List[Dict[str, Any]] = []
    for doc, score in results:
        source_file = doc.metadata.get("source", "Unknown")
        doc_name = doc.metadata.get("document_name")
        if not doc_name and source_file:
            doc_name = source_file.replace(".pdf", "").replace(".PDF", "").upper()

        rounded_score = float(round(score, 4))
        structured_results.append({
            "content": doc.page_content,
            "source": source_file,
            "page": doc.metadata.get("page", 0),
            "chunk_id": doc.metadata.get("chunk_id", "N/A"),
            "score": rounded_score,
            "distance_score": rounded_score,
            "act": doc_name,
        })

    logger.info(f"Retrieved {len(structured_results)} legal chunks successfully.")
    return structured_results

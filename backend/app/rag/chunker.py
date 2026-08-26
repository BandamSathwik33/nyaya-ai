"""Text chunker module for legal documents."""

import logging
from typing import List

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)


def chunk_documents(
    documents: List[Document],
    chunk_size: int = 1200,
    chunk_overlap: int = 200,
) -> List[Document]:
    """Splits loaded page documents into smaller, overlapping chunks suitable for legal RAG.
    
    Args:
        documents: List of Document objects (pages extracted from PDFs).
        chunk_size: Target maximum characters per chunk.
        chunk_overlap: Number of characters to overlap between sequential chunks.
        
    Returns:
        List of chunked Document objects with preserved and enriched metadata.
    """
    if not documents:
        logger.warning("No documents provided to chunker.")
        return []

    # Legal texts have clear section, paragraph, and line structures
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=[
            "\n\n\n",  # Major section / chapter breaks
            "\n\n",    # Paragraph breaks
            "\n",      # Line breaks
            ". ",      # Sentence breaks
            "; ",      # Clause breaks
            " ",       # Word boundaries
            ""         # Character fallback
        ],
        is_separator_regex=False,
    )

    chunked_docs: List[Document] = []
    
    # Process document by document to ensure chunk indexing is accurate per document/page
    chunk_counter_by_doc: dict = {}
    
    raw_splits = text_splitter.split_documents(documents)
    
    for split in raw_splits:
        clean_text = split.page_content.strip()
        if not clean_text:
            continue
            
        source = split.metadata.get("source", "unknown")
        page = split.metadata.get("page", 1)
        
        doc_key = f"{source}_p{page}"
        current_chunk_idx = chunk_counter_by_doc.get(doc_key, 0)
        chunk_counter_by_doc[doc_key] = current_chunk_idx + 1
        
        # Enrich metadata
        split.metadata["chunk_index"] = current_chunk_idx
        split.metadata["chunk_id"] = f"{doc_key}_c{current_chunk_idx}"
        split.metadata["chunk_size_chars"] = len(clean_text)
        
        chunked_docs.append(Document(page_content=clean_text, metadata=split.metadata))

    logger.info(
        f"Chunking complete: {len(documents)} page(s) transformed into {len(chunked_docs)} chunk(s) "
        f"(chunk_size={chunk_size}, chunk_overlap={chunk_overlap})."
    )
    return chunked_docs

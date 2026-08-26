"""ChromaDB vector store management for NyayaAI."""

import logging
import os
import time
from pathlib import Path
from typing import Dict, List, Optional

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from app.config import get_settings

logger = logging.getLogger(__name__)


_CACHED_VECTORSTORE: Optional[Chroma] = None
_CACHED_VECTORSTORE_KEY: Optional[str] = None


def get_vectorstore(
    embeddings: Embeddings,
    collection_name: Optional[str] = None,
    persist_directory: Optional[str] = None,
) -> Chroma:
    """Initializes and returns the persistent Chroma vector store instance.
    
    Args:
        embeddings: Embedding function for vector representations.
        collection_name: Name of the Chroma collection.
        persist_directory: Local filesystem directory for database persistence.
        
    Returns:
        Chroma vector store instance.
    """
    global _CACHED_VECTORSTORE, _CACHED_VECTORSTORE_KEY

    settings = get_settings()
    col_name = collection_name or settings.CHROMA_COLLECTION_NAME
    persist_dir = persist_directory or settings.CHROMA_PERSIST_DIRECTORY
    cache_key = f"{col_name}::{Path(persist_dir).resolve()}"

    if _CACHED_VECTORSTORE is not None and _CACHED_VECTORSTORE_KEY == cache_key:
        return _CACHED_VECTORSTORE

    # Ensure persist directory exists
    os.makedirs(persist_dir, exist_ok=True)

    logger.info(f"Opening Chroma vectorstore: collection='{col_name}', path='{Path(persist_dir).resolve()}'")
    
    _CACHED_VECTORSTORE = Chroma(
        collection_name=col_name,
        embedding_function=embeddings,
        persist_directory=persist_dir,
    )
    _CACHED_VECTORSTORE_KEY = cache_key
    return _CACHED_VECTORSTORE


def reset_collection(
    collection_name: Optional[str] = None,
    persist_directory: Optional[str] = None,
) -> None:
    """Resets the vectorstore collection by deleting all entries for fresh ingestion.
    
    Args:
        collection_name: Name of the Chroma collection to clear.
        persist_directory: Local persistence directory.
    """
    settings = get_settings()
    col_name = collection_name or settings.CHROMA_COLLECTION_NAME
    persist_dir = persist_directory or settings.CHROMA_PERSIST_DIRECTORY

    try:
        import chromadb
        client = chromadb.PersistentClient(path=persist_dir)
        collections = client.list_collections()
        col_names = [c.name for c in collections]
        
        if col_name in col_names:
            logger.info(f"Deleting existing collection '{col_name}' from ChromaDB.")
            client.delete_collection(col_name)
            logger.info(f"Collection '{col_name}' successfully deleted.")
        else:
            logger.info(f"Collection '{col_name}' does not exist yet. Ready for fresh ingestion.")
            
    except Exception as e:
        logger.warning(f"Note during collection reset: {e}")


def add_documents_in_batches(
    vectorstore: Chroma,
    documents: List[Document],
    batch_size: Optional[int] = None,
) -> int:
    """Adds chunked documents to Chroma vector store in batches with unique IDs to prevent duplicates.
    
    Args:
        vectorstore: Target Chroma vector store.
        documents: List of chunked Document objects.
        batch_size: Number of chunks per embedding batch (defaults to settings.EMBEDDING_BATCH_SIZE).
        
    Returns:
        Total number of documents stored.
    """
    if not documents:
        logger.warning("No documents to add to vectorstore.")
        return 0

    settings = get_settings()
    eff_batch_size = batch_size if batch_size is not None else settings.EMBEDDING_BATCH_SIZE
    total = len(documents)
    
    # Check existing IDs in collection to skip already-indexed chunks (fast resume)
    existing_ids = set()
    try:
        existing_data = vectorstore._collection.get(include=[])
        if existing_data and "ids" in existing_data:
            existing_ids = set(existing_data["ids"])
            if existing_ids:
                logger.info(f"Found {len(existing_ids)} existing chunks already in ChromaDB. Skipping them to save quota.")
    except Exception as e:
        logger.debug(f"Could not retrieve existing IDs (new collection): {e}")

    # Filter out already indexed documents
    pending_docs = [
        doc for doc in documents
        if doc.metadata.get("chunk_id") not in existing_ids
    ]
    
    if not pending_docs:
        logger.info(f"All {total} chunks are already indexed in ChromaDB.")
        return total

    logger.info(f"Indexing {len(pending_docs)} remaining chunk(s) (out of {total} total) into vectorstore in batches of {eff_batch_size}...")

    total_added = len(existing_ids)
    for i in range(0, len(pending_docs), eff_batch_size):
        batch = pending_docs[i : i + eff_batch_size]
        ids = [
            doc.metadata.get("chunk_id", f"doc_{i + idx}")
            for idx, doc in enumerate(batch)
        ]
        
        max_retries = 8
        for attempt in range(max_retries):
            try:
                vectorstore.add_documents(documents=batch, ids=ids)
                total_added += len(batch)
                logger.info(f"Indexed batch: {min(i + eff_batch_size, len(pending_docs))}/{len(pending_docs)} chunks ({total_added}/{total} total in DB).")
                # Polite pacing between batches for remote API; zero delay for local
                if settings.EMBEDDING_PROVIDER == "local":
                    time.sleep(0.01)
                else:
                    time.sleep(1.0)
                break
            except Exception as e:
                if attempt < max_retries - 1:
                    # Respect Google API daily / minute quota window (45-60s cooldown)
                    wait_time = 50 + (attempt * 10)
                    logger.warning(
                        f"Batch hit rate limit (429). Cooldown in progress: waiting {wait_time}s before retry {attempt + 1}/{max_retries}..."
                    )
                    time.sleep(wait_time)
                else:
                    logger.error(f"Error indexing batch after {max_retries} attempts: {e}")
                    raise

    return total_added


def get_vectorstore_stats(
    collection_name: Optional[str] = None,
    persist_directory: Optional[str] = None,
) -> Dict[str, object]:
    """Retrieves metadata and document count statistics from ChromaDB.
    
    Args:
        collection_name: Name of the Chroma collection.
        persist_directory: Local persistence directory.
        
    Returns:
        Dictionary containing document count, sources breakdown, and persist path.
    """
    settings = get_settings()
    col_name = collection_name or settings.CHROMA_COLLECTION_NAME
    persist_dir = persist_directory or settings.CHROMA_PERSIST_DIRECTORY

    try:
        import chromadb
        client = chromadb.PersistentClient(path=persist_dir)
        collections = client.list_collections()
        col_names = [c.name for c in collections]
        
        if col_name not in col_names:
            return {
                "collection_name": col_name,
                "persist_directory": str(Path(persist_dir).resolve()),
                "total_documents": 0,
                "sources": {},
                "status": "Collection does not exist",
            }
            
        collection = client.get_collection(col_name)
        count = collection.count()
        
        # Sample metadata to get source document distribution
        sources_summary: Dict[str, int] = {}
        if count > 0:
            sample_size = min(count, 5000)
            sample_data = collection.get(limit=sample_size, include=["metadatas"])
            for meta in sample_data.get("metadatas", []):
                if meta and "source" in meta:
                    src = meta["source"]
                    sources_summary[src] = sources_summary.get(src, 0) + 1

        return {
            "collection_name": col_name,
            "persist_directory": str(Path(persist_dir).resolve()),
            "total_documents": count,
            "sources": sources_summary,
            "status": "active",
        }
    except Exception as e:
        logger.error(f"Error querying vectorstore stats: {e}")
        return {
            "collection_name": col_name,
            "persist_directory": str(Path(persist_dir).resolve()),
            "total_documents": 0,
            "error": str(e),
            "status": "error",
        }

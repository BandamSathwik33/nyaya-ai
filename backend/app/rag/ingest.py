"""Pipeline orchestrator for ingesting legal PDFs into ChromaDB vector store."""

import argparse
import logging
import sys
import time
from pathlib import Path
from typing import Optional

from app.config import get_settings
from app.rag.chunker import chunk_documents
from app.rag.embeddings import get_embedding_model, validate_embedding_connection
from app.rag.loader import load_all_pdfs
from app.rag.vectorstore import (
    add_documents_in_batches,
    get_vectorstore,
    get_vectorstore_stats,
    reset_collection,
)

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("nyaya.rag.ingest")


def run_ingestion(
    data_dir: Optional[str] = None,
    persist_dir: Optional[str] = None,
    collection_name: Optional[str] = None,
    reset: bool = True,
    batch_size: Optional[int] = None,
) -> dict:
    """Executes the complete document ingestion pipeline.
    
    Pipeline Steps:
        1. Discover and load legal PDFs from data directory.
        2. Extract text and page metadata using PyMuPDF.
        3. Split text into overlapping chunks.
        4. Validate embedding model connectivity.
        5. Initialize ChromaDB vector store (resetting if requested).
        6. Compute embeddings and store vectors in batches.
        7. Verify and output statistics.
        
    Returns:
        Dictionary containing execution summary and statistics.
    """
    settings = get_settings()
    data_path = Path(data_dir or settings.DATA_DIRECTORY)
    storage_path = Path(persist_dir or settings.CHROMA_PERSIST_DIRECTORY)
    col_name = collection_name or settings.CHROMA_COLLECTION_NAME
    eff_batch_size = batch_size if batch_size is not None else settings.EMBEDDING_BATCH_SIZE

    start_time = time.time()
    
    print("\n" + "=" * 65)
    print("      NYAYAAI LEGAL KNOWLEDGE BASE INGESTION PIPELINE")
    print("=" * 65)
    print(f" Source Directory     : {data_path.resolve()}")
    print(f" Vector Store Path    : {storage_path.resolve()}")
    print(f" Collection Name      : {col_name}")
    print(f" Reset Mode           : {'Enabled (Clean Rebuild)' if reset else 'Incremental (In-place update)'}")
    print(f" Chunk Size / Overlap : {settings.CHUNK_SIZE} / {settings.CHUNK_OVERLAP}")
    print(f" Embedding Batch Size : {eff_batch_size}")
    print(f" Embedding Model      : {settings.EMBEDDING_MODEL}")
    print("=" * 65 + "\n")

    # Step 1 & 2: Discover and Load PDFs
    print("[1/5] Discovering and extracting text from PDFs...")
    try:
        page_docs = load_all_pdfs(data_path)
    except FileNotFoundError as e:
        print(f"\n[ERROR] Data directory error: {e}")
        return {"status": "error", "message": str(e)}
    except Exception as e:
        print(f"\n[ERROR] Failed to load PDFs: {e}")
        return {"status": "error", "message": str(e)}

    if not page_docs:
        print(f"\n[WARNING] No documents found in '{data_path}'. Ingestion aborted.")
        return {"status": "empty", "message": "No documents extracted"}

    unique_sources = {doc.metadata.get("source") for doc in page_docs}
    print(f"  -> Successfully extracted {len(page_docs)} pages from {len(unique_sources)} PDF file(s).")
    for src in sorted(unique_sources):
        pages_count = sum(1 for d in page_docs if d.metadata.get("source") == src)
        print(f"     * {src}: {pages_count} pages")

    # Step 3: Chunk Documents
    print("\n[2/5] Splitting documents into legal text chunks...")
    chunks = chunk_documents(
        page_docs,
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    print(f"  -> Generated {len(chunks)} overlapping chunks.")

    # Step 4: Validate Embedding Provider & API Key
    print("\n[3/5] Initializing and validating embedding provider...")
    try:
        embeddings = get_embedding_model()
        validate_embedding_connection(embeddings)
        print("  -> Google Gemini Embeddings API verified and ready.")
    except ValueError as ve:
        print(f"\n[CONFIG ERROR] {ve}")
        return {"status": "config_error", "message": str(ve)}
    except Exception as ee:
        print(f"\n[API ERROR] Embedding provider verification failed: {ee}")
        return {"status": "embedding_error", "message": str(ee)}

    # Step 5: Setup Vector Store & Reset if requested
    print("\n[4/5] Preparing ChromaDB vector store...")
    if reset:
        print(f"  -> Resetting collection '{col_name}' for clean rebuild...")
        reset_collection(collection_name=col_name, persist_directory=str(storage_path))

    vectorstore = get_vectorstore(
        embeddings=embeddings,
        collection_name=col_name,
        persist_directory=str(storage_path),
    )

    # Step 6: Generate Embeddings and Store in Batches
    print(f"\n[5/5] Generating embeddings and saving {len(chunks)} chunks to vector store...")
    try:
        indexed_count = add_documents_in_batches(
            vectorstore=vectorstore,
            documents=chunks,
            batch_size=eff_batch_size,
        )
    except Exception as e:
        print(f"\n[ERROR] Failed during batch vector storage: {e}")
        return {"status": "storage_error", "message": str(e)}

    # Final Verification & Statistics
    elapsed_time = time.time() - start_time
    stats = get_vectorstore_stats(collection_name=col_name, persist_directory=str(storage_path))

    print("\n" + "=" * 65)
    print("      INGESTION COMPLETED SUCCESSFULLY")
    print("=" * 65)
    print(f" Chunks Added/Verified : {indexed_count}")
    print(f" Total in Collection   : {stats.get('total_documents', 'N/A')}")
    print(f" Documents Breakdown   : {stats.get('sources', {})}")
    print(f" Time Elapsed          : {elapsed_time:.2f}s")
    print("=" * 65 + "\n")

    return {
        "status": "success",
        "chunks_indexed": indexed_count,
        "collection_stats": stats,
        "elapsed_seconds": elapsed_time,
    }


def main():
    """CLI entry point for running the RAG document ingestion pipeline."""
    parser = argparse.ArgumentParser(
        description="NyayaAI Legal Knowledge Base Ingestion Pipeline",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default=None,
        help="Path to directory containing source PDFs (default from config: DATA_DIRECTORY)",
    )
    parser.add_argument(
        "--persist-dir",
        type=str,
        default=None,
        help="Path to ChromaDB persist directory (default from config: CHROMA_PERSIST_DIRECTORY)",
    )
    parser.add_argument(
        "--collection",
        type=str,
        default=None,
        help="ChromaDB collection name (default from config: CHROMA_COLLECTION_NAME)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=None,
        help="Batch size for generating embeddings (default from config: EMBEDDING_BATCH_SIZE)",
    )
    parser.add_argument(
        "--no-reset",
        action="store_true",
        help="Disable collection reset (perform incremental update instead of rebuild)",
    )

    args = parser.parse_args()

    result = run_ingestion(
        data_dir=args.data_dir,
        persist_dir=args.persist_dir,
        collection_name=args.collection,
        reset=not args.no_reset,
        batch_size=args.batch_size,
    )

    if result.get("status") != "success":
        sys.exit(1)


if __name__ == "__main__":
    main()

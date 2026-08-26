"""NyayaAI Legal Knowledge Base - Semantic Retrieval Diagnostic Tool.

NOTE:
This script is a diagnostic testing tool to evaluate and inspect semantic similarity
retrieval from the ChromaDB legal knowledge base. It does not generate AI answers or
invoke LLMs—it tests pure embedding-based vector retrieval against the indexed Acts
(BNS, BNSS, BSA).
"""

import argparse
import sys
from pathlib import Path

from app.config import get_settings
from app.rag.embeddings import get_embedding_model
from app.rag.vectorstore import get_vectorstore


def test_retrieval(
    query: str,
    top_k: int = 5,
    persist_dir: str = None,
    collection_name: str = None,
) -> None:
    """Executes a semantic similarity search against the ChromaDB vector store.
    
    Args:
        query: User natural language query or legal phrase.
        top_k: Number of most relevant legal text chunks to retrieve.
        persist_dir: Optional ChromaDB storage directory override.
        collection_name: Optional ChromaDB collection name override.
    """
    settings = get_settings()
    storage_path = Path(persist_dir or settings.CHROMA_PERSIST_DIRECTORY).resolve()
    col_name = collection_name or settings.CHROMA_COLLECTION_NAME

    print("\n" + "=" * 70)
    print("        NYAYAAI LEGAL KNOWLEDGE BASE - RETRIEVAL DIAGNOSTIC")
    print("=" * 70)
    print(f" Storage Directory   : {storage_path}")
    print(f" Collection Name     : {col_name}")
    print(f" Embedding Provider  : {settings.EMBEDDING_PROVIDER}")
    print(f" Embedding Model     : {settings.EMBEDDING_MODEL}")
    print(f" Query Text          : \"{query}\"")
    print(f" Top Results (k)     : {top_k}")
    print("=" * 70 + "\n")

    # Verify vector store directory exists
    if not storage_path.exists():
        print(f"[ERROR] Vector store directory not found at: {storage_path}")
        print("Please run 'python ingest.py' first to build the knowledge base.\n")
        sys.exit(1)

    # 1. Initialize the configured embedding model
    try:
        embeddings = get_embedding_model()
    except Exception as e:
        print(f"[ERROR] Failed to initialize embedding model: {e}")
        sys.exit(1)

    # 2. Connect to existing ChromaDB collection (Read-Only, no reset)
    try:
        vectorstore = get_vectorstore(
            embeddings=embeddings,
            collection_name=col_name,
            persist_directory=str(storage_path),
        )
    except Exception as e:
        print(f"[ERROR] Failed to connect to ChromaDB collection '{col_name}': {e}")
        sys.exit(1)

    # 3. Check document count in collection
    try:
        total_docs = vectorstore._collection.count()
        if total_docs == 0:
            print(f"[WARNING] Collection '{col_name}' is empty (0 documents).")
            print("Please run 'python ingest.py' to index legal documents first.\n")
            return
        print(f"-> Connected to active collection containing {total_docs} legal chunks.\n")
    except Exception as e:
        print(f"[WARNING] Could not determine collection count: {e}\n")

    # 4. Perform Similarity Search with Scores
    try:
        print(f"Searching for most relevant legal provisions...")
        results_with_score = vectorstore.similarity_search_with_score(
            query=query,
            k=top_k,
        )
    except Exception as e:
        print(f"[ERROR] Semantic search failed: {e}")
        sys.exit(1)

    if not results_with_score:
        print("No matching legal provisions found for the given query.\n")
        return

    # 5. Display Formatted Results
    print(f"\nFound {len(results_with_score)} relevant legal passage(s):\n")

    for rank, (doc, score) in enumerate(results_with_score, start=1):
        source = doc.metadata.get("source", "Unknown Document")
        page = doc.metadata.get("page", "N/A")
        chunk_id = doc.metadata.get("chunk_id", "N/A")
        doc_name = doc.metadata.get("document_name", source)

        # Snippet preview (first ~500 chars)
        clean_text = " ".join(doc.page_content.split())
        preview = clean_text[:500] + ("..." if len(clean_text) > 500 else "")

        print(f"--- [Rank #{rank}] ----------------------------------------------------")
        print(f" Act / Document : {doc_name} ({source})")
        print(f" Page Number    : Page {page}")
        print(f" Chunk ID       : {chunk_id}")
        print(f" Distance Score : {score:.4f} (ChromaDB distance; lower = closer match)")
        print(f" Content Preview:")
        print(f" \"{preview}\"\n")

    print("=" * 70)
    print(" Diagnostic Complete - Relevant legal context successfully retrieved.")
    print("=" * 70 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="NyayaAI Semantic Retrieval Diagnostic Tool",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "query",
        type=str,
        nargs="?",
        default="Someone intentionally causes serious injury or hurt to another person",
        help="The legal query or situation to search for in the knowledge base",
    )
    parser.add_argument(
        "-k", "--top-k",
        type=int,
        default=5,
        help="Number of top chunks to retrieve",
    )
    parser.add_argument(
        "--persist-dir",
        type=str,
        default=None,
        help="ChromaDB storage directory override",
    )
    parser.add_argument(
        "--collection",
        type=str,
        default=None,
        help="ChromaDB collection name override",
    )

    args = parser.parse_args()

    test_retrieval(
        query=args.query,
        top_k=args.top_k,
        persist_dir=args.persist_dir,
        collection_name=args.collection,
    )


if __name__ == "__main__":
    main()

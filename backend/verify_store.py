"""Verification script to inspect ChromaDB vector store contents and metadata."""

import argparse
import sys
from pathlib import Path

from app.config import get_settings
from app.rag.vectorstore import get_vectorstore_stats


def main():
    parser = argparse.ArgumentParser(description="Verify NyayaAI ChromaDB vector store")
    parser.add_argument("--persist-dir", type=str, default=None, help="Chroma persist directory")
    parser.add_argument("--collection", type=str, default=None, help="Collection name")
    parser.add_argument("--samples", type=int, default=3, help="Number of sample chunks to display")

    args = parser.parse_args()
    settings = get_settings()

    persist_dir = args.persist_dir or settings.CHROMA_PERSIST_DIRECTORY
    col_name = args.collection or settings.CHROMA_COLLECTION_NAME

    print("\n" + "=" * 65)
    print("           NYAYAAI VECTOR STORE VERIFICATION")
    print("=" * 65)
    print(f" Directory  : {Path(persist_dir).resolve()}")
    print(f" Collection : {col_name}")
    print("=" * 65 + "\n")

    stats = get_vectorstore_stats(collection_name=col_name, persist_directory=persist_dir)

    print(f" Status           : {stats.get('status')}")
    print(f" Total Documents  : {stats.get('total_documents', 0)}")
    print(f" Sources Indexed  :")
    for src, count in stats.get("sources", {}).items():
        print(f"   * {src:20s}: {count} chunks")

    if stats.get("total_documents", 0) > 0 and args.samples > 0:
        import chromadb
        client = chromadb.PersistentClient(path=persist_dir)
        collection = client.get_collection(col_name)
        sample_data = collection.get(limit=args.samples, include=["documents", "metadatas"])
        
        print(f"\n Sample Chunks ({len(sample_data.get('documents', []))} shown):")
        for i, (doc, meta) in enumerate(zip(sample_data.get("documents", []), sample_data.get("metadatas", []))):
            print(f"\n --- Sample #{i+1} [Source: {meta.get('source')}, Page {meta.get('page')}, Chunk ID: {meta.get('chunk_id')}] ---")
            snippet = doc[:250].replace("\n", " ")
            print(f" {snippet}...")

    print("\n" + "=" * 65 + "\n")


if __name__ == "__main__":
    main()

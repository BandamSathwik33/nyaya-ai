"""CLI runner for NyayaAI legal document ingestion.

Run from D:\\nyaya\\backend:
    python ingest.py
    python ingest.py --no-reset
    python ingest.py --batch-size 100
"""

from app.rag.ingest import main

if __name__ == "__main__":
    main()

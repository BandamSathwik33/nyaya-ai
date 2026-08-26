"""RAG (Retrieval-Augmented Generation) module for NyayaAI legal documents."""

from app.rag.loader import load_all_pdfs, load_pdf
from app.rag.chunker import chunk_documents
from app.rag.embeddings import get_embedding_model, validate_embedding_connection
from app.rag.vectorstore import get_vectorstore, reset_collection, get_vectorstore_stats
from app.rag.ingest import run_ingestion
from app.rag.retriever import retrieve_legal_context
from app.rag.qa import answer_legal_question

__all__ = [
    "load_all_pdfs",
    "load_pdf",
    "chunk_documents",
    "get_embedding_model",
    "validate_embedding_connection",
    "get_vectorstore",
    "reset_collection",
    "get_vectorstore_stats",
    "run_ingestion",
    "retrieve_legal_context",
    "answer_legal_question",
]

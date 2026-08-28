"""Embedding factory and validation for NyayaAI."""

import logging
import os
from typing import Optional

from langchain_core.embeddings import Embeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import get_settings

logger = logging.getLogger(__name__)


_CACHED_EMBEDDING_MODEL: Optional[Embeddings] = None
_CACHED_MODEL_KEY: Optional[str] = None


class ChromaONNXEmbeddings(Embeddings):
    """Ultra-lightweight (25MB RAM) ONNX-quantized MiniLM embedding model for low-memory cloud hosts."""
    def __init__(self):
        from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2
        self.ef = ONNXMiniLM_L6_V2()

    def embed_documents(self, texts: list) -> list:
        return self.ef(texts)

    def embed_query(self, text: str) -> list:
        return self.ef([text])[0]



def get_embedding_model(
    provider: Optional[str] = None,
    model_name: Optional[str] = None,
    api_key: Optional[str] = None,
) -> Embeddings:
    """Instantiates the configured embedding model (ONNX MiniLM, Sentence-Transformers, or Google Gemini).
    
    Args:
        provider: "local" (HuggingFace/ONNX) or "gemini". Defaults to EMBEDDING_PROVIDER in config.
        model_name: Model identifier (e.g. 'sentence-transformers/all-MiniLM-L6-v2' or 'models/gemini-embedding-001').
        api_key: Optional Gemini API key override when using Gemini.
        
    Returns:
        Configured Embeddings instance.
    """
    global _CACHED_EMBEDDING_MODEL, _CACHED_MODEL_KEY

    settings = get_settings()
    prov = (provider or os.getenv("EMBEDDING_PROVIDER") or settings.EMBEDDING_PROVIDER).lower()
    model = model_name or os.getenv("EMBEDDING_MODEL") or settings.EMBEDDING_MODEL
    cache_key = f"{prov}::{model}"

    if _CACHED_EMBEDDING_MODEL is not None and _CACHED_MODEL_KEY == cache_key:
        return _CACHED_EMBEDDING_MODEL

    if prov == "local" or "sentence-transformers" in model.lower() or "minilm" in model.lower():
        logger.info(f"Initializing low-memory ONNX MiniLM embedding model: '{model}'")
        try:
            _CACHED_EMBEDDING_MODEL = ChromaONNXEmbeddings()
            _CACHED_MODEL_KEY = cache_key
            return _CACHED_EMBEDDING_MODEL
        except Exception as onnx_err:
            logger.warning(f"ONNX MiniLM initialization failed: {onnx_err}. Falling back to HuggingFaceEmbeddings...")
            try:
                import torch
                torch.set_grad_enabled(False)
                torch.set_num_threads(1)
                from langchain_huggingface import HuggingFaceEmbeddings
                _CACHED_EMBEDDING_MODEL = HuggingFaceEmbeddings(
                    model_name=model,
                    model_kwargs={"device": "cpu"},
                    encode_kwargs={"normalize_embeddings": True},
                )
                _CACHED_MODEL_KEY = cache_key
                return _CACHED_EMBEDDING_MODEL
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                raise ImportError(
                    "Please install chromadb onnxruntime or langchain-huggingface sentence-transformers"
                ) from e

    # Fallback to Google Gemini Embeddings
    key = api_key or os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
    if not key or not key.strip() or key.strip() == "your_gemini_api_key_here":
        error_msg = (
            "Google Gemini API key is missing or currently set to placeholder value ('your_gemini_api_key_here'). "
            "Please set your actual GEMINI_API_KEY in backend/.env."
        )
        logger.error(error_msg)
        raise ValueError(error_msg)

    logger.info(f"Initializing Gemini embedding model: '{model}'")
    _CACHED_EMBEDDING_MODEL = GoogleGenerativeAIEmbeddings(
        model=model,
        google_api_key=key.strip(),
    )
    _CACHED_MODEL_KEY = cache_key
    return _CACHED_EMBEDDING_MODEL


def validate_embedding_connection(embeddings: Embeddings) -> bool:
    """Verifies that the embedding provider is reachable and the API key is active.
    
    Args:
        embeddings: The Embeddings instance to validate.
        
    Returns:
        True if validation succeeds.
        
    Raises:
        RuntimeError: If probe embedding fails.
    """
    try:
        probe_text = "NyayaAI legal knowledge base probe."
        result = embeddings.embed_query(probe_text)
        if not result or len(result) == 0:
            raise ValueError("Embedding provider returned empty vector.")
        logger.info(f"Embedding connection validated successfully (dimension: {len(result)}).")
        return True
    except Exception as e:
        error_msg = f"Failed to connect to embedding provider: {e}"
        logger.error(error_msg)
        raise RuntimeError(error_msg) from e

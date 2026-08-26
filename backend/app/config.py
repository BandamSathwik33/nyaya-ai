import os
from functools import lru_cache
from typing import List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Explicitly load .env file from the backend directory
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_env_path = os.path.join(_backend_dir, ".env")
load_dotenv(_env_path, override=True)


class Settings(BaseSettings):
    APP_NAME: str = "NyayaAI Backend"
    APP_ENV: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"

    # LLM & Embeddings
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"
    EMBEDDING_PROVIDER: str = "local"  # "local" (HuggingFace) or "gemini"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Data & Ingestion
    DATA_DIRECTORY: str = "./data"
    CHUNK_SIZE: int = 1200
    CHUNK_OVERLAP: int = 200
    EMBEDDING_BATCH_SIZE: int = 100

    # ChromaDB Vectorstore
    CHROMA_PERSIST_DIRECTORY: str = "./vectorstore"
    CHROMA_COLLECTION_NAME: str = "nyaya_legal_knowledge_base"

    # Retrieval & Confidence Thresholds (Chroma distance: lower is better)
    CONFIDENCE_HIGH_THRESHOLD: float = 0.95
    CONFIDENCE_MEDIUM_THRESHOLD: float = 1.20

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated allowed origins into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()

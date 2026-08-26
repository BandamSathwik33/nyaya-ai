"""Database connection and session management for NyayaAI."""

import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Store SQLite DB in the backend directory
DB_DIR = Path(__file__).resolve().parent.parent.parent / "data"
os.makedirs(DB_DIR, exist_ok=True)
SQLITE_DB_PATH = DB_DIR / "nyaya_users.db"

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{SQLITE_DB_PATH}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency for yielding database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes all database tables."""
    Base.metadata.create_all(bind=engine)

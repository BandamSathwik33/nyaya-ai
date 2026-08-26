"""SQLAlchemy ORM models for Users, Profiles, and Security Logs."""

import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class User(Base):
    """User account model supporting Email/Password and Google OAuth."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for Google OAuth users
    full_name = Column(String(255), nullable=True)
    auth_provider = Column(String(50), default="email")  # "email" | "google"
    google_sub = Column(String(255), unique=True, nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("UserAuditLog", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    """User onboarding questions, persona, and legal research purpose."""
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # 1. Who is the user? (Persona)
    # Options: "victim_complainant", "citizen_general", "student_researcher", "legal_advocate", "police_officer"
    user_type = Column(String(50), default="citizen_general", nullable=False)

    # 2. What is their purpose?
    # Options: "seeking_remedy", "reporting_crime", "academic_study", "case_preparation", "statutory_reference"
    purpose = Column(String(100), default="general_awareness", nullable=False)

    # 3. Context / Background description provided by user during onboarding
    background_notes = Column(Text, nullable=True)

    # 4. User experience & preferences
    experience_level = Column(String(50), default="beginner")  # "beginner", "intermediate", "expert"
    preferred_language = Column(String(20), default="en")  # "en", "hi"
    is_onboarding_completed = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")


class UserAuditLog(Base):
    """Security audit log for queries and guardrail detections."""
    __tablename__ = "user_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    event_type = Column(String(50), nullable=False)  # "LOGIN", "QUERY", "GUARDRAIL_BLOCKED", "PROFILE_UPDATE"
    query_text = Column(Text, nullable=True)
    guardrail_reason = Column(String(255), nullable=True)
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

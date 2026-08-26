"""Pydantic schemas for Authentication, Registration, and User Onboarding."""

import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# --- Auth Schemas ---
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100, description="Password must be at least 6 characters")
    full_name: Optional[str] = Field(None, max_length=150)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(..., description="Google OAuth2 OpenID Connect ID token from client")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    is_onboarding_completed: bool
    user_id: int
    email: str
    full_name: Optional[str] = None


# --- Onboarding Questionnaire Schemas ---
class OnboardingQuestionnaireRequest(BaseModel):
    user_type: str = Field(
        ...,
        description="Persona: 'victim_complainant' | 'citizen_general' | 'student_researcher' | 'legal_advocate' | 'police_officer'"
    )
    purpose: str = Field(
        ...,
        description="Purpose: 'seeking_remedy' | 'reporting_crime' | 'academic_study' | 'case_preparation' | 'statutory_reference' | 'general_awareness'"
    )
    background_notes: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="Compulsory factual situation or case background"
    )
    experience_level: Optional[str] = Field("beginner", description="'beginner' | 'intermediate' | 'expert'")
    preferred_language: Optional[str] = Field("en", description="'en' | 'hi'")


class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    user_type: str
    purpose: str
    background_notes: Optional[str] = None
    experience_level: str
    preferred_language: str
    is_onboarding_completed: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class UserDetailResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    auth_provider: str
    is_active: bool
    is_onboarding_completed: bool
    profile: Optional[UserProfileResponse] = None

    class Config:
        from_attributes = True

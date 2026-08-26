"""User profile and onboarding questionnaire routes."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import User, UserAuditLog, UserProfile
from app.models.auth_schemas import (
    OnboardingQuestionnaireRequest,
    UserProfileResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/user", tags=["User Profile & Onboarding"])

VALID_USER_TYPES = {
    "victim_complainant": "Victim / Complainant",
    "citizen_general": "Citizen / General Public",
    "student_researcher": "Law Student / Academic Researcher",
    "legal_advocate": "Legal Advocate / Practitioner",
    "police_officer": "Law Enforcement / Police Officer",
}

VALID_PURPOSES = {
    "seeking_remedy": "Seeking Legal Remedy / Protection",
    "reporting_crime": "Reporting a Crime / Lodging FIR",
    "academic_study": "Academic & Statutory Study",
    "case_preparation": "Case Preparation & Legal Drafting",
    "statutory_reference": "Statutory Reference & Research",
    "general_awareness": "General Legal Awareness",
}


@router.post("/onboarding", response_model=UserProfileResponse)
def submit_onboarding_questionnaire(
    payload: OnboardingQuestionnaireRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Saves the user's answers to the onboarding questionnaire (Persona, Purpose, Experience)."""
    user_type = payload.user_type.lower().strip()
    purpose = payload.purpose.lower().strip()

    if user_type not in VALID_USER_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user_type '{user_type}'. Must be one of: {list(VALID_USER_TYPES.keys())}",
        )

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    profile.user_type = user_type
    profile.purpose = purpose
    profile.background_notes = payload.background_notes.strip() if payload.background_notes else None
    profile.experience_level = payload.experience_level or "beginner"
    profile.preferred_language = payload.preferred_language or "en"
    profile.is_onboarding_completed = True

    # Audit log
    audit = UserAuditLog(
        user_id=current_user.id,
        event_type="ONBOARDING_COMPLETED",
        query_text=f"Persona={user_type}, Purpose={purpose}",
    )
    db.add(audit)
    db.commit()
    db.refresh(profile)

    return UserProfileResponse(
        id=profile.id,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        auth_provider=current_user.auth_provider,
        user_type=profile.user_type,
        purpose=profile.purpose,
        background_notes=profile.background_notes,
        experience_level=profile.experience_level,
        preferred_language=profile.preferred_language,
        is_onboarding_completed=profile.is_onboarding_completed,
        created_at=profile.created_at,
    )


@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves the authenticated user's current persona profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(
            user_id=current_user.id,
            user_type="citizen_general",
            purpose="general_awareness",
            is_onboarding_completed=False,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return UserProfileResponse(
        id=profile.id,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        auth_provider=current_user.auth_provider,
        user_type=profile.user_type,
        purpose=profile.purpose,
        background_notes=profile.background_notes,
        experience_level=profile.experience_level,
        preferred_language=profile.preferred_language,
        is_onboarding_completed=profile.is_onboarding_completed,
        created_at=profile.created_at,
    )


@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(
    payload: OnboardingQuestionnaireRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates the user's persona, purpose, or preferences."""
    return submit_onboarding_questionnaire(payload=payload, current_user=current_user, db=db)

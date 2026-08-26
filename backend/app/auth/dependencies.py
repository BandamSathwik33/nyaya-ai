"""FastAPI authentication dependencies for current user and profile validation."""

import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.security import decode_access_token
from app.db.database import get_db
from app.db.models import User, UserProfile

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency to extract and authenticate the current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials. Please login again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise credentials_exception

    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """FastAPI dependency for optional authentication (supports both guests and logged-in users)."""
    if not credentials or not credentials.credentials:
        return None

    try:
        payload = decode_access_token(credentials.credentials)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
        return user
    except Exception:
        return None


def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfile:
    """Dependency that returns the current user's profile or creates a default one if missing."""
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
    return profile

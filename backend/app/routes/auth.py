"""Authentication routes for Email/Password and Google OAuth."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.security import (
    create_access_token,
    get_password_hash,
    verify_google_id_token,
    verify_password,
)
from app.db.database import get_db
from app.db.models import User, UserAuditLog, UserProfile
from app.models.auth_schemas import (
    GoogleLoginRequest,
    TokenResponse,
    UserDetailResponse,
    UserLoginRequest,
    UserRegisterRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user with Email and Password."""
    clean_email = payload.email.lower().strip()
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please login instead.",
        )

    # Hash password & create user
    hashed_pwd = get_password_hash(payload.password)
    new_user = User(
        email=clean_email,
        hashed_password=hashed_pwd,
        full_name=payload.full_name.strip() if payload.full_name else None,
        auth_provider="email",
        is_active=True,
        is_verified=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create default empty profile (onboarding required)
    profile = UserProfile(
        user_id=new_user.id,
        user_type="citizen_general",
        purpose="general_awareness",
        is_onboarding_completed=False,
    )
    db.add(profile)

    # Log audit event
    audit = UserAuditLog(user_id=new_user.id, event_type="REGISTER")
    db.add(audit)
    db.commit()

    # Generate JWT
    token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=1440 * 60,
        is_onboarding_completed=False,
        user_id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """Logs in an existing user with Email and Password."""
    clean_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact support.",
        )

    # Check onboarding status
    is_onboarding_done = user.profile.is_onboarding_completed if user.profile else False

    # Log audit event
    audit = UserAuditLog(user_id=user.id, event_type="LOGIN")
    db.add(audit)
    db.commit()

    token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=1440 * 60,
        is_onboarding_completed=is_onboarding_done,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
    )


@router.post("/google", response_model=TokenResponse)
def google_sign_in(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Verifies a Google OAuth2 ID token and authenticates or registers the user."""
    google_data = verify_google_id_token(payload.id_token)
    if not google_data or not google_data.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to verify Google Sign-In token. Token is invalid or expired.",
        )

    email = google_data["email"].lower().strip()
    google_sub = google_data.get("sub")
    full_name = google_data.get("name")

    # Find or create user
    user = db.query(User).filter((User.email == email) | (User.google_sub == google_sub)).first()

    if not user:
        # Register new Google user
        user = User(
            email=email,
            full_name=full_name,
            auth_provider="google",
            google_sub=google_sub,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create initial profile
        profile = UserProfile(
            user_id=user.id,
            user_type="citizen_general",
            purpose="general_awareness",
            is_onboarding_completed=False,
        )
        db.add(profile)
        db.commit()
        db.refresh(user)
    else:
        # Update existing user info if needed
        if not user.google_sub:
            user.google_sub = google_sub
            db.commit()

    is_onboarding_done = user.profile.is_onboarding_completed if user.profile else False

    audit = UserAuditLog(user_id=user.id, event_type="GOOGLE_LOGIN")
    db.add(audit)
    db.commit()

    token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=1440 * 60,
        is_onboarding_completed=is_onboarding_done,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
    )


@router.get("/me", response_model=UserDetailResponse)
def get_current_user_details(current_user: User = Depends(get_current_user)):
    """Fetches full account and profile details for the currently authenticated user."""
    is_onboarding_done = current_user.profile.is_onboarding_completed if current_user.profile else False
    return UserDetailResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        auth_provider=current_user.auth_provider,
        is_active=current_user.is_active,
        is_onboarding_completed=is_onboarding_done,
        profile=current_user.profile,
    )

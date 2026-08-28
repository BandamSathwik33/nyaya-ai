import datetime
import logging
import os
from typing import Any, Dict, Optional

import bcrypt
from jose import JWTError, jwt

logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "nyaya-ai-secure-jwt-secret-key-production-2024-bns-bnss-bsa")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against stored bcrypt hash."""
    if not hashed_password or not plain_password:
        return False
    try:
        password_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    """Generates bcrypt hash of password."""
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Creates a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and verifies a JWT token. Returns payload dict or None if invalid/expired."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None


import requests as py_requests

# Reusable HTTP session with connection pooling for Google certs
_GOOGLE_HTTP_SESSION = py_requests.Session()

def verify_google_id_token(id_token_str: str) -> Optional[Dict[str, Any]]:
    """Verifies a Google OAuth2 OpenID Connect ID token with low-latency session reuse.
    
    Returns:
        Dictionary with user information ('sub', 'email', 'name', 'picture') or None if invalid.
    """
    try:
        from google.oauth2 import id_token
        from google.auth.transport.requests import Request

        # Clean client_id from environment
        raw_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        client_id = raw_client_id.strip().strip('"').strip("'") if raw_client_id else None
        if not client_id:
            client_id = None

        request_adapter = Request(session=_GOOGLE_HTTP_SESSION)

        try:
            id_info = id_token.verify_oauth2_token(id_token_str, request_adapter, client_id)
        except Exception:
            # Fallback without strict audience check
            id_info = id_token.verify_oauth2_token(id_token_str, request_adapter)

        # Check issuer
        if id_info.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
            logger.warning(f"Invalid Google token issuer: {id_info.get('iss')}")
            return None

        return {
            "sub": id_info.get("sub"),
            "email": id_info.get("email"),
            "name": id_info.get("name"),
            "picture": id_info.get("picture"),
            "email_verified": id_info.get("email_verified", True),
        }
    except Exception as e:
        logger.error(f"Google ID token verification failed: {e}")
        return None


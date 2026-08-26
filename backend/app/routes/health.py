from datetime import datetime, timezone
from fastapi import APIRouter, Depends

from app.config import Settings, get_settings
from app.models.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
async def health_check(settings: Settings = Depends(get_settings)):
    """Health check endpoint to verify backend service status."""
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        environment=settings.APP_ENV,
        timestamp=datetime.now(timezone.utc)
    )

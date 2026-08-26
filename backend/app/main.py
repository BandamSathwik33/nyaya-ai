from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db.database import init_db
from app.routes.auth import router as auth_router
from app.routes.health import router as health_router
from app.routes.legal import router as legal_router
from app.routes.user import router as user_router

settings = get_settings()

# Initialize Database tables
try:
    init_db()
except Exception as e:
    import logging
    logging.getLogger(__name__).warning(f"Database init warning: {e}")

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for NyayaAI - AI Legal Research Assistant with Persona Profiling & Anti-Criminality Guardrails",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS Middleware for Frontend (React / Vite / Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(legal_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

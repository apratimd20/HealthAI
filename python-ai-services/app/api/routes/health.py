"""
Health check endpoints.
"""
from fastapi import APIRouter
from app.core.config import config
from app.services.ai_service import ai_service

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": config.APP_NAME,
        "version": config.APP_VERSION,
        "model": {
            "name": config.MODEL_NAME,
            "loaded": ai_service.is_available()
        }
    }

@router.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": config.APP_NAME,
        "version": config.APP_VERSION,
        "description": config.APP_DESCRIPTION,
        "endpoints": [
            {"path": "/health", "method": "GET", "description": "Health check"},
            {"path": "/chat", "method": "POST", "description": "Send a message"},
            {"path": "/chat-stream", "method": "POST", "description": "Streaming chat"},
            {"path": "/docs", "method": "GET", "description": "API documentation"},
        ]
    }
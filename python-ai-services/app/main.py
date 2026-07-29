# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import config
from app.api.routes import health, chat, food  
from app.services.ai_service import ai_service
import logging

logging.basicConfig(level=getattr(logging, config.LOG_LEVEL))
logger = logging.getLogger(__name__)

app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    description=config.APP_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix=config.API_PREFIX)
app.include_router(chat.router, prefix=config.API_PREFIX)
app.include_router(food.router, prefix=config.API_PREFIX)  # ✅ Add food

@app.on_event("startup")
async def startup_event():
    logger.info(f"🚀 Starting {config.APP_NAME} v{config.APP_VERSION}")
    
    if ai_service.is_available():
        logger.info("✅ Groq API ready for chat!")
        logger.info(f"📦 Chat Model: {ai_service.model}")
    else:
        logger.warning("⚠️ Chat: Using fallback responses")
    
    if ai_service.gemini_available:
        logger.info("✅ Gemini API ready for vision!")
        logger.info("📦 Vision Model: gemini-1.5-flash")
    else:
        logger.warning("⚠️ Vision: Food analysis unavailable")
    
    logger.info("✅ Service ready!")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Shutting down...")
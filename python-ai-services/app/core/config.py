# app/core/config.py
import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Config:
    APP_NAME = os.getenv("APP_NAME", "Health AI Service")
    APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
    APP_DESCRIPTION = os.getenv("APP_DESCRIPTION", "AI-powered health and nutrition assistant")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    PORT = int(os.getenv("PORT", "8000"))
    API_PREFIX = os.getenv("API_PREFIX", "/api/v1")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # ✅ Groq API Key (from environment)
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

config = Config()
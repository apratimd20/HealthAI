# app/api/routes/food.py
"""
Food analysis endpoints using Gemini Vision
"""
import json
import base64
import time
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.ai_service import ai_service

router = APIRouter()

class FoodAnalysisRequest(BaseModel):
    """Request model for food analysis"""
    image: str  # base64 encoded image
    filename: Optional[str] = None

@router.post("/analyze-food")
async def analyze_food(request: FoodAnalysisRequest):
    """Analyze a food image from base64"""
    try:
        result = ai_service.analyze_food_image(request.image)
        
        if not result:
            return {
                "success": False,
                "message": "Failed to analyze food image"
            }
        
        return {
            "success": True,
            "data": result,
            "source": "gemini_vision"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-food-stream")
async def analyze_food_stream(request: FoodAnalysisRequest):
    """Stream food analysis from base64"""
    try:
        async def generate():
            for chunk in ai_service.analyze_food_image_stream(request.image):
                yield chunk
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-food-fallback")
async def analyze_food_fallback(request: FoodAnalysisRequest):
    """Fallback analysis with retry logic"""
    try:
        max_attempts = 5
        for attempt in range(max_attempts):
            result = ai_service.analyze_food_image(request.image)
            if result:
                return {
                    "success": True,
                    "data": result,
                    "source": "gemini_vision",
                    "attempt": attempt + 1
                }
            
            if attempt < max_attempts - 1:
                time.sleep(2 ** attempt)
        
        return {
            "success": False,
            "message": "Failed to analyze after multiple attempts"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
"""
Pydantic models for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., description="User's message", min_length=1, max_length=1000)
    goal: Optional[str] = Field(None, description="User's health goal")
    session_id: Optional[str] = Field(None, description="Session identifier")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "How can I lose weight?",
                "goal": "weight loss"
            }
        }

class ChatResponseData(BaseModel):
    """Response data model"""
    message: str
    timestamp: datetime
    source: str

class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    success: bool = True
    data: ChatResponseData

class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: str
    error_code: Optional[str] = None
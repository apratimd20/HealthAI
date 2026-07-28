"""
Response generation service - handles fallback responses.
"""
import random
from typing import List, Dict
from app.models.health_tips import HEALTH_TIPS, DEFAULT_TIPS

class ResponseService:
    """Service for generating fallback responses"""
    
    def __init__(self):
        self.tips = HEALTH_TIPS
        self.default_tips = DEFAULT_TIPS
    
    def generate_response(self, message: str) -> str:
        """Generate a response based on message content"""
        message_lower = message.lower()
        
        # Check each keyword
        for keyword in self.tips.keys():
            if keyword in message_lower:
                return random.choice(self.tips[keyword])
        
        # No match found, return a random default tip
        return random.choice(self.default_tips)
    
    def get_source_name(self) -> str:
        """Get the source name"""
        return "health_tips_fallback"
    
    def get_available_categories(self) -> List[str]:
        """Get all available categories"""
        return list(self.tips.keys())

# Singleton instance
response_service = ResponseService()
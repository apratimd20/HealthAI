# app/services/ai_service.py
"""
AI service for chat (Groq) and food analysis (Gemini Vision)
"""
import os
import logging
import json
import time
import re
from typing import Optional, Generator, Dict, Any
from groq import Groq
from app.core.config import config

# ✅ Import Gemini with try/except
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("⚠️ google-generativeai not installed. Install with: pip install google-generativeai")

logger = logging.getLogger(__name__)

class AIService:
    """AI service for chat (Groq) and vision (Gemini)"""
    
    def __init__(self):
        # ============ Groq for Chat ============
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.client = None
        self.is_loaded = False
        self.model = "llama-3.1-8b-instant"
        
        if self.groq_api_key and self.groq_api_key.startswith("gsk_"):
            try:
                self.client = Groq(api_key=self.groq_api_key)
                self.is_loaded = True
                logger.info("✅ Groq API initialized successfully!")
                logger.info(f"📦 Chat Model: {self.model}")
                self._test_connection()
            except Exception as e:
                logger.error(f"❌ Failed to initialize Groq: {e}")
                self.is_loaded = False
        else:
            logger.warning("⚠️ GROQ_API_KEY not set. Chat will use fallback.")
            logger.info("💡 Get your free API key from: https://console.groq.com")
        
        # ============ Gemini for Vision ============
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.gemini_model = None
        self.gemini_available = False
        
        if GENAI_AVAILABLE and self.gemini_api_key:
            try:
                genai.configure(api_key=self.gemini_api_key)
                
                # ✅ Try multiple model names
                model_names = [
                    "gemini-1.5-pro",
                    "gemini-1.0-pro-vision",
                    "gemini-pro-vision",
                    "gemini-1.5-flash",
                ]
                
                for model_name in model_names:
                    try:
                        logger.info(f"🔄 Trying model: {model_name}")
                        self.gemini_model = genai.GenerativeModel(model_name)
                        # Quick test
                        test_response = self.gemini_model.generate_content("Hello")
                        if test_response:
                            self.gemini_available = True
                            logger.info(f"✅ Gemini API initialized with model: {model_name}")
                            break
                    except Exception as e:
                        logger.warning(f"⚠️ Model {model_name} not available: {e}")
                        continue
                
                if not self.gemini_available:
                    logger.error("❌ No Gemini vision model available")
                    logger.info("💡 Available models: https://ai.google.dev/gemini-api/docs/models")
                
            except Exception as e:
                logger.error(f"❌ Failed to initialize Gemini: {e}")
                self.gemini_available = False
        elif not GENAI_AVAILABLE:
            logger.warning("⚠️ google-generativeai package not installed.")
            logger.info("💡 Install with: pip install google-generativeai")
        else:
            logger.warning("⚠️ GEMINI_API_KEY not set. Food analysis will use fallback.")
            logger.info("💡 Get your free API key from: https://aistudio.google.com/apikey")
    
    def _test_connection(self):
        """Test if Groq API is working"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10,
            )
            logger.info("✅ Groq connection test successful!")
        except Exception as e:
            logger.error(f"❌ Groq connection test failed: {e}")
            self.is_loaded = False
    
    def load_model(self) -> bool:
        """No download needed - API ready"""
        return self.is_loaded
    
    def is_available(self) -> bool:
        """Check if chat service is available"""
        return self.is_loaded
    
    # =====================================================
    # ============ CHAT FUNCTIONS (Groq) ============
    # =====================================================
    
    def generate_response(self, prompt: str) -> Optional[str]:
        """Generate chat response using Groq API"""
        if not self.is_loaded or not self.client:
            logger.warning("Groq not available, using fallback")
            return None
        
        try:
            messages = [
                {
                    "role": "system",
                    "content": """You are NutriAI, a helpful health and nutrition assistant.
                    Provide clear, practical advice about health, fitness, and nutrition.
                    Keep responses concise, friendly, and actionable.
                    Never give medical advice - always recommend consulting a doctor for serious concerns."""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=300,
                top_p=0.9,
            )
            
            if response and response.choices:
                return response.choices[0].message.content.strip()
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Groq error: {e}")
            return None
    
    def generate_response_stream(self, prompt: str) -> Generator[str, None, None]:
        """Generate streaming response using Groq API"""
        if not self.is_loaded or not self.client:
            logger.warning("Groq not available")
            yield "I apologize, but the AI service is currently unavailable. Please try again later."
            return
        
        try:
            messages = [
                {
                    "role": "system",
                    "content": """You are NutriAI, a helpful health and nutrition assistant.
                    Provide clear, practical advice about health, fitness, and nutrition.
                    Keep responses concise and actionable."""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=300,
                top_p=0.9,
                stream=True,
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"❌ Streaming error: {e}")
            yield "I apologize, but I encountered an error. Please try again."
    
    # =========================================================
    # ============ FOOD ANALYSIS FUNCTIONS (Gemini) ============
    # =========================================================
    
    def analyze_food_image(self, image_base64: str, mime_type: str = "image/jpeg") -> Optional[Dict[str, Any]]:
        """
        Analyze food image using Gemini Vision with retry logic
        """
        if not self.gemini_available or not self.gemini_model:
            logger.warning("Gemini not available for vision")
            return None
        
        prompt = """Analyze this food image and return ONLY valid JSON with the following structure:
        {
            "foodName": "Name of the food dish",
            "calories": 0,
            "protein": 0,
            "carbohydrates": 0,
            "fat": 0,
            "fiber": 0,
            "sugar": 0,
            "healthyScore": 0,
            "description": "Brief description of the food and its nutritional value",
            "portionSize": "Estimated portion size"
        }
        
        Only return the JSON object, no other text."""
        
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                logger.info(f"🔄 Analyzing food image (attempt {attempt + 1}/{max_retries})...")
                
                image_part = {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": image_base64
                    }
                }
                
                response = self.gemini_model.generate_content([prompt, image_part])
                
                if response and response.text:
                    text = response.text
                    json_match = self._extract_json(text)
                    
                    if json_match:
                        data = json.loads(json_match)
                        logger.info(f"✅ Food analysis complete: {data.get('foodName', 'Unknown')}")
                        return data
                    else:
                        logger.warning("Could not extract JSON from response")
                
                return None
                
            except Exception as e:
                error_msg = str(e)
                
                if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                    logger.warning(f"⚠️ Rate limit hit (attempt {attempt + 1}/{max_retries})")
                    
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (2 ** attempt)
                        logger.info(f"⏳ Waiting {wait_time}s before retry...")
                        time.sleep(wait_time)
                        continue
                    else:
                        logger.error("❌ Max retries exceeded for rate limit")
                        return None
                else:
                    logger.error(f"❌ Gemini vision error: {error_msg}")
                    return None
        
        return None
    
    def analyze_food_image_stream(self, image_base64: str, mime_type: str = "image/jpeg") -> Generator[str, None, None]:
        """Stream food analysis response"""
        if not self.gemini_available or not self.gemini_model:
            yield f"event: error\ndata: {json.dumps({'message': 'Gemini not available'})}\n\n"
            return
        
        prompt = """Analyze this food image and return ONLY valid JSON with the following structure:
        {
            "foodName": "Name of the food dish",
            "calories": 0,
            "protein": 0,
            "carbohydrates": 0,
            "fat": 0,
            "fiber": 0,
            "sugar": 0,
            "healthyScore": 0,
            "description": "Brief description of the food and its nutritional value",
            "portionSize": "Estimated portion size"
        }
        
        Only return the JSON object, no other text."""
        
        try:
            image_part = {
                "inline_data": {
                    "mime_type": mime_type,
                    "data": image_base64
                }
            }
            
            yield f"event: status\ndata: {json.dumps({'message': '🔍 Analyzing food image...'})}\n\n"
            
            response = self.gemini_model.generate_content([prompt, image_part])
            
            if response and response.text:
                text = response.text
                json_match = self._extract_json(text)
                
                if json_match:
                    data = json.loads(json_match)
                    json_str = json.dumps(data, indent=2)
                    
                    chunk_size = 10
                    for i in range(0, len(json_str), chunk_size):
                        chunk = json_str[i:i+chunk_size]
                        yield f"event: chunk\ndata: {json.dumps({'chunk': chunk})}\n\n"
                        time.sleep(0.02)
                    
                    yield f"event: complete\ndata: {json.dumps({'success': True, 'data': data})}\n\n"
                else:
                    yield f"event: error\ndata: {json.dumps({'message': 'Could not parse response'})}\n\n"
            else:
                yield f"event: error\ndata: {json.dumps({'message': 'No response from Gemini'})}\n\n"
                
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg:
                yield f"event: error\ndata: {json.dumps({'message': 'Rate limit exceeded. Please try again in a moment.'})}\n\n"
            else:
                yield f"event: error\ndata: {json.dumps({'message': error_msg})}\n\n"
        
        yield f"event: done\ndata: {json.dumps({'message': 'Analysis complete'})}\n\n"
    
    def _extract_json(self, text: str) -> Optional[str]:
        """Extract JSON from text"""
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json_match.group(0)
        return None

# Singleton instance
ai_service = AIService()
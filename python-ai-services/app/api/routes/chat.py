# app/api/routes/chat.py
"""
Chat endpoints with Groq streaming
"""
import json
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest
from app.services.response_service import response_service
from app.services.ai_service import ai_service
from app.utils.helpers import create_response_data, create_success_response

router = APIRouter()

@router.post("/chat")
async def chat(request: ChatRequest):
    """Non-streaming chat endpoint"""
    try:
        if ai_service.is_available():
            ai_response = ai_service.generate_response(request.message)
            if ai_response:
                response_data = create_response_data(ai_response, "ai_model")
                return create_success_response(response_data)
        
        # Fallback to health tips
        fallback_response = response_service.generate_response(request.message)
        response_data = create_response_data(fallback_response, "health_tips_fallback")
        return create_success_response(response_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat-stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat endpoint"""
    
    async def generate_stream():
        try:
            # Check if AI is available
            if ai_service.is_available():
                # Send status
                yield f"event: status\ndata: {json.dumps({'message': '🤖 AI is thinking...'})}\n\n"
                
                try:
                    full_response = ""
                    # Get streaming response
                    for chunk in ai_service.generate_response_stream(request.message):
                        if chunk:
                            full_response += chunk
                            yield f"event: chunk\ndata: {json.dumps({'chunk': chunk})}\n\n"
                            await asyncio.sleep(0.01)
                    
                    # Send complete
                    yield f"event: complete\ndata: {json.dumps({'success': True, 'message': full_response, 'source': 'ai_model'})}\n\n"
                    
                except Exception as e:
                    yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"
                    # Fallback to health tips
                    fallback = response_service.generate_response(request.message)
                    yield f"event: chunk\ndata: {json.dumps({'chunk': fallback})}\n\n"
                    yield f"event: complete\ndata: {json.dumps({'success': True, 'message': fallback, 'source': 'health_tips_fallback'})}\n\n"
            
            else:
                # Use health tips fallback
                yield f"event: status\ndata: {json.dumps({'message': '💡 Using health tips...'})}\n\n"
                
                response_text = response_service.generate_response(request.message)
                words = response_text.split()
                for i in range(0, len(words), 3):
                    chunk = " ".join(words[i:i+3]) + " "
                    yield f"event: chunk\ndata: {json.dumps({'chunk': chunk})}\n\n"
                    await asyncio.sleep(0.05)
                
                yield f"event: complete\ndata: {json.dumps({'success': True, 'message': response_text, 'source': 'health_tips_fallback'})}\n\n"
            
            # Done
            yield f"event: done\ndata: {json.dumps({'message': 'Complete'})}\n\n"
            
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"
            yield f"event: done\ndata: {json.dumps({'message': 'Complete'})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
"""
Utility functions.
"""
from datetime import datetime
from typing import Any, Dict

def get_current_timestamp() -> str:
    """Get current UTC timestamp in ISO format"""
    return datetime.utcnow().isoformat() + "Z"

def create_response_data(message: str, source: str) -> Dict[str, Any]:
    """Create a standardized response data object"""
    return {
        "message": message,
        "timestamp": get_current_timestamp(),
        "source": source
    }

def create_success_response(data: Any) -> Dict[str, Any]:
    """Create a standardized success response"""
    return {
        "success": True,
        "data": data
    }

def create_error_response(error: str, error_code: str = None) -> Dict[str, Any]:
    """Create a standardized error response"""
    response = {
        "success": False,
        "error": error
    }
    if error_code:
        response["error_code"] = error_code
    return response
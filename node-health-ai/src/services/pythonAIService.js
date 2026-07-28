// services/pythonAIService.js
import axios from 'axios';

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000/api/v1';

export const pythonAIService = {
    // Non-streaming chat
    sendMessage: async (message, token) => {
        try {
            const response = await axios.post(`${PYTHON_AI_URL}/chat`, {
                message
            }, {
                headers: {
                    'token': token
                }
            });
            return response.data;
        } catch (error) {
            console.error('Python AI service error:', error.message);
            return null;
        }
    },

    // Streaming chat
    sendMessageStream: async (message, token) => {
        const response = await fetch(`${PYTHON_AI_URL}/chat-stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': token, // ✅ Pass token from request
            },
            body: JSON.stringify({ message }),
        });
        return response;
    }
};
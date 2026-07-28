// src/services/chatService.js
import api from './api';

export const chatService = {
  sendMessage: async (message) => {
    const response = await api.post('/chat/chat', { message });
    return response.data;
  },

  // ✅ Fixed streaming method with proper event parsing
  sendMessageStream: async (message, onStatus, onChunk, onComplete, onError) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.replace('event: ', '').trim();
          } else if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.replace('data: ', '');
              const data = JSON.parse(jsonStr);
              
              // Dispatch based on current event
              switch (currentEvent) {
                case 'status':
                  if (onStatus) onStatus(data);
                  break;
                case 'chunk':
                  if (onChunk) onChunk(data);
                  break;
                case 'complete':
                  if (onComplete) onComplete(data);
                  break;
                case 'error':
                  if (onError) onError(data);
                  break;
                case 'done':
                  // Stream finished
                  break;
                default:
                  // Try to infer event from data
                  if (data.chunk !== undefined && onChunk) {
                    onChunk(data);
                  } else if (data.message !== undefined && onStatus) {
                    onStatus(data);
                  }
              }
            } catch (e) {
              console.error('Parse error for line:', line, e);
            }
          }
        }
      }
    } catch (error) {
      if (onError) {
        onError({ message: error.message });
      }
    }
  },

  getSuggestions: async () => {
    const response = await api.get('/chat/suggestions');
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/chat/history');
    return response.data;
  },
};
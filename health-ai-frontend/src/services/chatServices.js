// src/services/chatService.js
import api from './api';

export const chatService = {
  sendMessage: async (message) => {
    const response = await api.post('/chat/chat', { message });
    return response.data;
  },

  // ✅ Updated streaming method with proper event handling
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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.split('event: ')[1].trim();
            // Find the data line
            const dataLines = lines.filter(l => l.startsWith('data: '));
            const dataLine = dataLines[dataLines.length - 1];
            
            if (dataLine && dataLine.startsWith('data: ')) {
              try {
                const jsonStr = dataLine.replace('data: ', '');
                const data = JSON.parse(jsonStr);
                
                switch (eventType) {
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
                    break;
                }
              } catch (e) {
                console.error('Parse error for event:', eventType, e);
              }
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
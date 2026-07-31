// src/services/chatService.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'token': localStorage.getItem('token') || '',
  };
}

export const chatService = {
  sendMessage: async (message, history = []) => {
    const response = await fetch(`${BASE_URL}/chat/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, history }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  sendMessageStream: async (message, history = [], onStatus, onChunk, onComplete, onError) => {
    try {
      const response = await fetch(`${BASE_URL}/chat/chat-stream`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message, history }),
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
                  break;
                default:
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
    const response = await fetch(`${BASE_URL}/chat/suggestions`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getHistory: async () => {
    const response = await fetch(`${BASE_URL}/chat/history`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
};
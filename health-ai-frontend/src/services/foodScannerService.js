// src/services/foodScannerService.js
import api from './api';

export const foodScannerService = {
    /**
     * Upload and analyze a food image
     * @param {File} imageFile - The image file to analyze
     * @returns {Promise} - Analysis result
     */
    analyzeFood: async (imageFile) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const response = await api.post('/food/analyse', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000, // 60 seconds timeout
        });
        
        return response.data;
    },

    /**
     * Analyze food with streaming
     * @param {File} imageFile - The image file to analyze
     * @param {Function} onStatus - Status callback
     * @param {Function} onChunk - Chunk callback
     * @param {Function} onComplete - Complete callback
     * @param {Function} onError - Error callback
     */
    analyzeFoodStream: async (imageFile, onStatus, onChunk, onComplete, onError) => {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/food/analyse-stream`, {
                method: 'POST',
                headers: {
                    'token': token,
                },
                body: formData,
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        const eventType = line.replace('event: ', '').trim();
                        const dataLine = lines[lines.indexOf(line) + 1];
                        if (dataLine && dataLine.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(dataLine.replace('data: ', ''));
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
                                }
                            } catch (e) {
                                console.error('Parse error:', e);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            if (onError) onError({ message: error.message });
        }
    },
};
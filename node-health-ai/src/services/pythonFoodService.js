// services/pythonFoodService.js
import axios from 'axios';
import fs from 'fs';

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000/api/v1';

export const pythonFoodService = {
    // ✅ Send image as base64 (no multipart issues)
    analyzeFood: async (imagePath) => {
        try {
            // Read image and convert to base64
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            
            const response = await axios.post(
                `${PYTHON_AI_URL}/analyze-food`,
                {
                    image: base64Image,
                    filename: imagePath.split('/').pop(),
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 60000,
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('❌ Python food service error:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Status:', error.response.status);
            }
            return null;
        }
    },

    // ✅ Streaming with base64
    analyzeFoodStream: async (imagePath, res) => {
        try {
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            
            const response = await fetch(`${PYTHON_AI_URL}/analyze-food-stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64Image,
                    filename: imagePath.split('/').pop(),
                }),
            });
            
            // Forward the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                res.write(chunk);
            }
            
            res.end();
            
        } catch (error) {
            console.error('❌ Stream food analysis error:', error);
            throw error;
        }
    },

    // ✅ Fallback with base64
    analyzeFoodWithFallback: async (imagePath, maxRetries = 3) => {
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Food analysis attempt ${attempt}/${maxRetries}...`);
                
                const imageBuffer = fs.readFileSync(imagePath);
                const base64Image = imageBuffer.toString('base64');
                
                const response = await axios.post(
                    `${PYTHON_AI_URL}/analyze-food-fallback`,
                    {
                        image: base64Image,
                        filename: imagePath.split('/').pop(),
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        timeout: 90000,
                    }
                );
                
                if (response.data && response.data.success) {
                    console.log(`✅ Food analysis successful (attempt ${attempt})`);
                    return response.data;
                }
                
                if (response.data) {
                    return response.data;
                }
                
                lastError = 'No data returned from service';
                
            } catch (error) {
                lastError = error.message;
                console.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
                
                if (attempt < maxRetries) {
                    const waitTime = attempt * 2000;
                    console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        
        console.error(`❌ All ${maxRetries} attempts failed`);
        return {
            success: false,
            message: lastError || 'Failed to analyze food after multiple attempts'
        };
    },

    healthCheck: async () => {
        try {
            const response = await axios.get(`${PYTHON_AI_URL}/health`, {
                timeout: 5000,
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
};
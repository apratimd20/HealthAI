// controllers/food.controller.js
import fs from 'fs';
import { pythonFoodService } from '../services/pythonFoodService.js';
import { analyseFoodImage as localAnalyseFood } from '../services/ai.service.js';

export const analyseFood = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file uploaded"
            });
        }

        const imagePath = req.file.path;
        console.log(`📸 Analyzing food image: ${imagePath}`);

        // ✅ Try Python service first
        const result = await pythonFoodService.analyzeFoodWithFallback(imagePath);
        
        // If Python service succeeded
        if (result && result.success) {
            return res.status(200).json({
                success: true,
                data: result.data,
                source: result.source || 'python_service',
                attempt: result.attempt || 1
            });
        }

        // ✅ Fallback to local Gemini analysis
        console.log('⚠️ Python service failed, using local fallback...');
        const localResult = await localAnalyseFood(imagePath);
        
        if (localResult && localResult.success) {
            return res.status(200).json({
                success: true,
                data: localResult.data,
                source: 'local_fallback'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to analyze food image'
        });

    } catch (error) {
        console.error('❌ Food analysis error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to analyze food image"
        });
    } finally {
        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.warn('⚠️ Could not delete file:', err);
            });
        }
    }
};

export const analyseFoodStream = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file uploaded"
            });
        }

        const imagePath = req.file.path;
        console.log(`📸 Streaming food analysis: ${imagePath}`);

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // Send initial status
        res.write(`event: status\ndata: ${JSON.stringify({ message: '🔍 Starting food analysis...' })}\n\n`);

        // Use Python service for streaming
        await pythonFoodService.analyzeFoodStream(imagePath, res);

    } catch (error) {
        console.error('❌ Stream analysis error:', error);
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to analyze food image"
            });
        }
        res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
        res.end();
    } finally {
        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.warn('⚠️ Could not delete file:', err);
            });
        }
    }
};

export const analyseFoodHealth = async (req, res) => {
    try {
        const isHealthy = await pythonFoodService.healthCheck();
        return res.status(200).json({
            success: true,
            python_service: isHealthy ? 'healthy' : 'unavailable',
            status: 'ok'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
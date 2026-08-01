// controllers/food.controller.js
import fs from 'fs';
import { analyseFoodImage, analyseFoodImageStream } from '../services/ai.service.js';

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

        // ✅ Native Gemini Vision food analysis (no Python proxy)
        const result = await analyseFoodImage(imagePath);

        if (result && result.success) {
            return res.status(200).json({
                success: true,
                data: result.data,
                source: result.source || 'groq_native'
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
        res.write(`event: status\ndata: ${JSON.stringify({ message: '🔍 Starting food analysis with vision AI...' })}\n\n`);

        // ✅ Native food image scanning using Groq/Gemini pipeline
        await analyseFoodImageStream(imagePath, res);

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
    return res.status(200).json({
        success: true,
        groq_service: process.env.GROQ_API_KEY ? 'configured' : 'key missing',
        gemini_service: process.env.GEMINI_API_KEY ? 'configured' : 'key missing',
        openai_service: process.env.OPENAI_API_KEY ? 'configured' : 'key missing',
        status: 'ok',
        note: 'Food scanning uses Groq first, then Gemini/OpenAI as fallbacks.'
    });
};
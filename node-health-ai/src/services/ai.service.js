// services/ai.service.js
// Native Node.js AI services — Gemini Vision (primary) + OpenAI (fallback)
// Replaces the Python FastAPI microservice

import fs from 'fs';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI VISION — Food Image Analysis (non-streaming)
// ─────────────────────────────────────────────────────────────────────────────
export const analyseFoodImage = async (imagePath) => {
    const FOOD_PROMPT = `Analyze this food image and return ONLY valid JSON with exactly this structure:
{
    "foodName": "name of the food dish",
    "calories": 0,
    "protein": 0,
    "carbohydrates": 0,
    "fat": 0,
    "fiber": 0,
    "sugar": 0,
    "healthyScore": 0,
    "description": "Brief nutritional description",
    "portionSize": "Estimated portion size"
}
Only return the JSON object, no markdown, no other text.`;

    const imageData = fs.readFileSync(imagePath);
    const base64image = imageData.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png'
                   : imagePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

    // ✅ Try Gemini Vision first
    if (process.env.GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const maxRetries = 3;
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const result = await model.generateContent([
                        FOOD_PROMPT,
                        { inlineData: { mimeType, data: base64image } }
                    ]);
                    const text = result.response.text();
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const data = JSON.parse(jsonMatch[0]);
                        console.log(`✅ Gemini food analysis: ${data.foodName}`);
                        return { success: true, data, source: 'gemini' };
                    }
                } catch (err) {
                    const msg = err.message || '';
                    if ((msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) && attempt < maxRetries - 1) {
                        const wait = 2000 * Math.pow(2, attempt);
                        console.warn(`⚠️ Gemini rate limit, retrying in ${wait}ms...`);
                        await new Promise(r => setTimeout(r, wait));
                        continue;
                    }
                    throw err;
                }
            }
        } catch (geminiErr) {
            console.warn('⚠️ Gemini food analysis failed, trying OpenAI:', geminiErr.message);
        }
    }

    // ✅ Fallback: OpenAI GPT-4o-mini Vision
    if (process.env.OPENAI_API_KEY) {
        try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: FOOD_PROMPT },
                        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64image}` } }
                    ]
                }],
                max_tokens: 350,
            });
            const text = response.choices[0].message.content;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                console.log(`✅ OpenAI food analysis: ${data.foodName}`);
                return { success: true, data, source: 'openai' };
            }
        } catch (openaiErr) {
            console.error('❌ OpenAI food fallback failed:', openaiErr.message);
        }
    }

    return { success: false, message: 'Food analysis failed. Check API keys.' };
};

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI VISION — Food Image Analysis (SSE streaming)
// ─────────────────────────────────────────────────────────────────────────────
export const analyseFoodImageStream = async (imagePath, res) => {
    const FOOD_PROMPT = `Analyze this food image and return ONLY valid JSON with exactly this structure:
{
    "foodName": "name of the food dish",
    "calories": 0,
    "protein": 0,
    "carbohydrates": 0,
    "fat": 0,
    "fiber": 0,
    "sugar": 0,
    "healthyScore": 0,
    "description": "Brief nutritional description",
    "portionSize": "Estimated portion size"
}
Only return the JSON object, no markdown, no other text.`;

    try {
        const imageData = fs.readFileSync(imagePath);
        const base64image = imageData.toString('base64');
        const mimeType = imagePath.endsWith('.png') ? 'image/png'
                       : imagePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

        res.write(`event: status\ndata: ${JSON.stringify({ message: '🔍 Analyzing with Gemini Vision...' })}\n\n`);

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent([
            FOOD_PROMPT,
            { inlineData: { mimeType, data: base64image } }
        ]);

        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            const jsonStr = JSON.stringify(data, null, 2);

            // Stream the JSON in small chunks for UI effect
            const chunkSize = 10;
            for (let i = 0; i < jsonStr.length; i += chunkSize) {
                res.write(`event: chunk\ndata: ${JSON.stringify({ chunk: jsonStr.slice(i, i + chunkSize) })}\n\n`);
                await new Promise(r => setTimeout(r, 20));
            }

            res.write(`event: complete\ndata: ${JSON.stringify({ success: true, data, source: 'gemini' })}\n\n`);
        } else {
            res.write(`event: error\ndata: ${JSON.stringify({ message: 'Could not parse food analysis response' })}\n\n`);
        }

    } catch (error) {
        console.error('❌ Gemini Vision stream error:', error.message);
        const msg = error.message.includes('429')
            ? 'Rate limit exceeded. Please try again in a moment.'
            : error.message;
        res.write(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`);
    }

    res.write(`event: done\ndata: ${JSON.stringify({ message: 'Analysis complete' })}\n\n`);
    res.end();
};
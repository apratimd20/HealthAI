// services/ai.service.js
// Native Node.js AI services — Gemini Vision (primary) + OpenAI (fallback)
// Replaces the Python FastAPI microservice

import fs from 'fs';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = 'gemini-2.0-flash';

const parseFoodAnalysisJson = (text) => {
    if (!text) return null;

    const cleanedText = String(text)
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    try {
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.warn('⚠️ Failed to parse food analysis JSON:', error.message);
        return null;
    }
};

const runGroqVisionAnalysis = async (foodPrompt, base64image, mimeType) => {
    if (!process.env.GROQ_API_KEY) return null;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
        model: 'llama-3.2-11b-vision-preview',
        messages: [{
            role: 'user',
            content: [
                { type: 'text', text: foodPrompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64image}` } }
            ]
        }],
        max_tokens: 400,
        temperature: 0.2,
    });

    const text = response.choices?.[0]?.message?.content || '';
    const data = parseFoodAnalysisJson(text);
    if (!data) return null;

    return { success: true, data, source: 'groq' };
};

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

    // ✅ Use the existing Groq key for food image analysis first
    if (process.env.GROQ_API_KEY) {
        try {
            const result = await runGroqVisionAnalysis(FOOD_PROMPT, base64image, mimeType);
            if (result?.success) {
                console.log(`✅ Groq food analysis: ${result.data.foodName}`);
                return result;
            }
        } catch (groqErr) {
            console.warn('⚠️ Groq food analysis failed, trying Gemini:', groqErr.message);
        }
    }

    // ✅ Try Gemini Vision next
    if (process.env.GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

            const maxRetries = 3;
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const result = await model.generateContent([
                        FOOD_PROMPT,
                        { inlineData: { mimeType, data: base64image } }
                    ]);
                    const text = result.response.text();
                    const data = parseFoodAnalysisJson(text);
                    if (data) {
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
            const data = parseFoodAnalysisJson(text);
            if (data) {
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

        res.write(`event: status\ndata: ${JSON.stringify({ message: '🔍 Analyzing food with Groq Vision...' })}\n\n`);

        let resultData = null;
        let source = 'groq';

        if (process.env.GROQ_API_KEY) {
            try {
                const groqResult = await runGroqVisionAnalysis(FOOD_PROMPT, base64image, mimeType);
                if (groqResult?.success) {
                    resultData = groqResult.data;
                    source = groqResult.source;
                }
            } catch (groqErr) {
                console.warn('⚠️ Groq stream failed; falling back to Gemini:', groqErr.message);
            }
        }

        if (!resultData && process.env.GEMINI_API_KEY) {
            source = 'gemini';
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

            const result = await model.generateContent([
                FOOD_PROMPT,
                { inlineData: { mimeType, data: base64image } }
            ]);

            resultData = parseFoodAnalysisJson(result.response.text());
        }

        if (resultData) {
            const jsonStr = JSON.stringify(resultData, null, 2);

            // Stream the JSON in small chunks for UI effect
            const chunkSize = 10;
            for (let i = 0; i < jsonStr.length; i += chunkSize) {
                res.write(`event: chunk\ndata: ${JSON.stringify({ chunk: jsonStr.slice(i, i + chunkSize) })}\n\n`);
                await new Promise(r => setTimeout(r, 20));
            }

            res.write(`event: complete\ndata: ${JSON.stringify({ success: true, data: resultData, source })}\n\n`);
        } else {
            res.write(`event: error\ndata: ${JSON.stringify({ message: 'Could not parse food analysis response' })}\n\n`);
        }

    } catch (error) {
        console.error('❌ Food scan stream error:', error.message);
        const msg = error.message.includes('429')
            ? 'Rate limit exceeded. Please try again in a moment.'
            : error.message;
        res.write(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`);
    }

    res.write(`event: done\ndata: ${JSON.stringify({ message: 'Analysis complete' })}\n\n`);
    res.end();
};
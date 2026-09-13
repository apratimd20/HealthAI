// src/services/groq.service.js
// Native Groq AI chat service with multi-model fallback
import Groq from 'groq-sdk';

let groqClient = null;
let isGroqAvailable = false;

const GROQ_MODELS = [
    'qwen/qwen3.8-27b',
    'groq/compound-mini',
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b',
];

function getGroqClient() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;
    if (!apiKey.startsWith('gsk_')) {
        console.warn('⚠️ GROQ_API_KEY does not look valid (should start with gsk_)');
        return null;
    }
    if (!groqClient) {
        groqClient = new Groq({ apiKey });
        console.log('✅ Groq client initialized');
    }
    return groqClient;
}

// Test connection on startup
(async () => {
    const client = getGroqClient();
    if (!client) {
        console.warn('⚠️ GROQ_API_KEY not set. Add it to .env to enable Groq chat.');
        console.info('   Get a free key at: https://console.groq.com');
        return;
    }
    for (const model of GROQ_MODELS) {
        try {
            await client.chat.completions.create({
                model,
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 5,
            });
            isGroqAvailable = true;
            console.log(`✅ Groq API connected successfully using model: ${model}`);
            break;
        } catch (e) {
            console.warn(`⚠️ Groq model test for ${model} failed: ${e.message}`);
        }
    }
})();

/**
 * Generate a non-streaming Groq chat response
 * @param {string} prompt  User message
 * @param {string} systemPrompt  System context
 * @param {Array} [history]  Previous messages [{role, content}]
 * @returns {Promise<string|null>}
 */
export async function groqChat(prompt, systemPrompt, history = []) {
    const client = getGroqClient();
    if (!client) return null;

    for (const model of GROQ_MODELS) {
        try {
            const response = await client.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history.slice(-10),
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 600,
                top_p: 0.9,
            });
            let content = response.choices[0]?.message?.content?.trim() || null;
            if (content) {
                // Strip think tags if model outputs them
                content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                return content;
            }
        } catch (error) {
            console.error(`❌ Groq chat error on model ${model}:`, error.message);
        }
    }
    return null;
}

/**
 * Stream a Groq chat response to an Express SSE res object
 * @param {string} prompt
 * @param {string} systemPrompt
 * @param {Array} [history]  Previous messages [{role, content}]
 * @param {object} res  Express response object
 * @returns {Promise<boolean>}  true if streaming succeeded
 */
export async function groqChatStream(prompt, systemPrompt, history, res, onComplete) {
    const client = getGroqClient();
    if (!client) return false;

    for (const model of GROQ_MODELS) {
        try {
            const stream = await client.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...(history || []).slice(-10),
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 600,
                top_p: 0.9,
                stream: true,
            });

            let fullResponse = '';
            let chunkCount = 0;

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullResponse += content;
                    chunkCount++;
                    res.write(`event: chunk\ndata: ${JSON.stringify({
                        chunk: content,
                        progress: Math.min(chunkCount * 2, 95)
                    })}\n\n`);
                }
            }

            // Strip any think tags from full response
            const cleanedResponse = fullResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

            res.write(`event: complete\ndata: ${JSON.stringify({
                success: true,
                message: cleanedResponse || fullResponse,
                timestamp: new Date().toISOString(),
                source: 'groq'
            })}\n\n`);
            res.write(`event: done\ndata: ${JSON.stringify({ message: 'Response complete' })}\n\n`);
            res.end();
            if (typeof onComplete === 'function') onComplete(cleanedResponse || fullResponse);
            return true;
        } catch (error) {
            console.error(`❌ Groq stream error on model ${model}:`, error.message);
        }
    }
    return false;
}

export { isGroqAvailable };


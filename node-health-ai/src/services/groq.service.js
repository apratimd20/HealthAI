// src/services/groq.service.js
// Native Groq AI chat service using llama-3.1-8b-instant
import Groq from 'groq-sdk';

let groqClient = null;
let isGroqAvailable = false;

function getGroqClient() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;
    if (!apiKey.startsWith('gsk_')) {
        console.warn('⚠️ GROQ_API_KEY does not look valid (should start with gsk_)');
        return null;
    }
    if (!groqClient) {
        groqClient = new Groq({ apiKey });
        console.log('✅ Groq client initialized (llama-3.1-8b-instant)');
    }
    return groqClient;
}

// Test connection on startup
(async () => {
    const client = getGroqClient();
    if (!client) {
        console.warn('⚠️ GROQ_API_KEY not set. Add it to .env to enable Groq Llama chat.');
        console.info('   Get a free key at: https://console.groq.com');
        return;
    }
    try {
        await client.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5,
        });
        isGroqAvailable = true;
        console.log('✅ Groq API connected successfully');
    } catch (e) {
        console.warn(`⚠️ Groq connection test failed: ${e.message}`);
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

    try {
        const response = await client.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                ...history.slice(-10),
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 600,
            top_p: 0.9,
        });
        return response.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
        console.error('❌ Groq chat error:', error.message);
        return null;
    }
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

    try {
        const stream = await client.chat.completions.create({
            model: 'llama-3.1-8b-instant',
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

        res.write(`event: complete\ndata: ${JSON.stringify({
            success: true,
            message: fullResponse,
            timestamp: new Date().toISOString(),
            source: 'groq'
        })}\n\n`);
        res.write(`event: done\ndata: ${JSON.stringify({ message: 'Response complete' })}\n\n`);
        res.end();
        if (typeof onComplete === 'function') onComplete(fullResponse);
        return true;
    } catch (error) {
        console.error('❌ Groq stream error:', error.message);
        return false;
    }
}

export { isGroqAvailable };

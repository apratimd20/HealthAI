// services/chat.services.js
import OpenAI from "openai";
import { groqChat, groqChatStream } from "./groq.service.js";

// ✅ Helper to get OpenAI client (with error handling)
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    return new OpenAI({ apiKey });
}

// ============ MAIN FUNCTIONS ============

function getSystemPrompt(user, goal) {
    let goalContext = '';
    let userContext = '';

    if (goal) {
        goalContext = `
        User's Health Profile:
        - Goal: ${goal.goal} weight (${goal.targetWeight}kg target)
        - Age: ${goal.age} years
        - Gender: ${goal.gender}
        - Height: ${goal.height}cm
        - Current Weight: ${goal.weight}kg
        - Activity Level: ${goal.activityLevel}
        - Diet Preference: ${goal.foodPreference}
        - Sleep Target: ${goal.sleepHours} hours
        - Exercise Days: ${goal.exerciseDays || 3} days/week
        ${goal.medicalConditions?.length ? `- Medical Conditions: ${goal.medicalConditions.join(', ')}` : ''}
        ${goal.allergies?.length ? `- Allergies: ${goal.allergies.join(', ')}` : ''}
        `;
    }

    if (user) {
        userContext = `
        User Name: ${user.name || 'User'}
        Email: ${user.email}
        `;
    }

    return `You are NutriAI, a friendly health and nutrition assistant having a conversation.

${userContext}
${goalContext}

Rules:
- Keep responses SHORT — 1-3 sentences max, like a real chat
- Be conversational, not academic
- Never give medical advice — recommend consulting a doctor for serious concerns
- If asked something you don't know, say so honestly
- Use simple language, no markdown formatting
- Previous messages are part of our conversation — stay consistent`;
}

// ============ CHAT RESPONSE WITH FALLBACK ============

function buildMessages(systemPrompt, history, message) {
    return [
        { role: "system", content: systemPrompt },
        ...(history || []).slice(-10),
        { role: "user", content: message }
    ];
}

export const generateChatResponse = async (message, user, goal, history = []) => {
    const systemPrompt = getSystemPrompt(user, goal);
    const messages = buildMessages(systemPrompt, history, message);

    // ✅ Try Groq first
    try {
        const groqResponse = await groqChat(message, systemPrompt, history);
        if (groqResponse) {
            return {
                message: groqResponse,
                timestamp: new Date().toISOString(),
                source: "groq",
            };
        }
    } catch (e) {
        console.warn('⚠️ Groq unavailable, trying OpenAI:', e.message);
    }

    // ✅ Try OpenAI as fallback
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 300,
    });
    return {
        message: response.choices[0].message.content,
        timestamp: new Date().toISOString(),
        source: "openai",
    };
};

export const generateHealthChatStream = async (message, user, goal, history = [], res) => {
    const systemPrompt = getSystemPrompt(user, goal);
    const messages = buildMessages(systemPrompt, history, message);

    // ✅ Try Groq streaming first
    try {
        const groqSucceeded = await groqChatStream(message, systemPrompt, history, res);
        if (groqSucceeded) return;
    } catch (e) {
        console.warn('⚠️ Groq stream unavailable, trying OpenAI:', e.message);
    }

    // ✅ Try OpenAI streaming
    const openai = getOpenAIClient();
    const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 300,
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
        source: "openai"
    })}\n\n`);
    res.write(`event: done\ndata: ${JSON.stringify({ message: 'Response complete' })}\n\n`);
    res.end();
};

// Get quick health tips (for suggestions)
export const getQuickTips = async (goal) => {
    const tips = {
        lose: [
            "🥗 Eat more protein to stay full longer",
            "🚶 Walk 10,000 steps daily",
            "💧 Drink 2-3L water daily",
            "🍎 Replace processed snacks with fruits",
        ],
        gain: [
            "💪 Eat 5-6 small meals daily",
            "🥩 Include protein in every meal",
            "🏋️ Focus on compound exercises",
            "🥜 Add healthy fats like nuts and avocados",
        ],
        maintain: [
            "⚖️ Balance your macros 40/30/30",
            "🏃 Stay active daily",
            "😴 Get 7-9 hours of sleep",
            "🥗 Eat colorful vegetables",
        ],
    };

    return tips[goal?.goal] || tips.maintain;
};
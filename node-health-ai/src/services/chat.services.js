// services/chat.services.js
import OpenAI from "openai";
import Goal from "../models/goal.models.js";

// ✅ Helper to get OpenAI client (with error handling)
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    return new OpenAI({ apiKey });
}

// ============ FALLBACK RESPONSES ============
function getFallbackResponse(message, user, goal) {
    const lowerMsg = message.toLowerCase();
    
    // Health tips database
    const tips = {
        weightLoss: [
            "🥗 Focus on portion control and eat more vegetables. Aim for a calorie deficit of 300-500 calories per day.",
            "🏃 Combine cardio and strength training for best results. Try 30 minutes of moderate exercise 5 days a week.",
            "💧 Drink 2-3 liters of water daily. It helps with metabolism and reduces hunger cravings.",
            "😴 Get 7-9 hours of quality sleep. Poor sleep can disrupt hunger hormones and metabolism.",
            "🍎 Replace processed snacks with whole foods like fruits, nuts, and vegetables.",
        ],
        weightGain: [
            "💪 Eat 5-6 smaller meals throughout the day to increase calorie intake.",
            "🥩 Include protein-rich foods in every meal: chicken, fish, eggs, legumes, and dairy.",
            "🥜 Add healthy fats like avocados, nuts, seeds, and olive oil to your meals.",
            "🏋️ Focus on strength training and compound exercises to build muscle mass.",
            "🍚 Increase portion sizes gradually and choose calorie-dense foods like rice, pasta, and healthy oils.",
        ],
        nutrition: [
            "🥬 Eat a rainbow of colorful vegetables and fruits for diverse nutrients.",
            "💧 Stay hydrated with 8-10 glasses of water daily. Herbal teas count too!",
            "🍞 Choose whole grains over refined carbs for better nutrition and satiety.",
            "🐟 Include omega-3 rich foods like salmon, walnuts, and flaxseeds.",
            "🥛 Ensure adequate calcium intake through dairy, leafy greens, or fortified alternatives.",
        ],
        fitness: [
            "🏃 Start with 20-30 minutes of moderate exercise 3-4 times a week.",
            "💪 Include both cardio and strength training for balanced fitness.",
            "🧘 Don't forget rest days! Your muscles need time to recover and grow.",
            "📈 Track your progress to stay motivated. Small improvements add up!",
            "🤸 Mix up your workouts to prevent boredom and work different muscle groups.",
        ],
        sleep: [
            "😴 Aim for 7-9 hours of consistent sleep each night.",
            "📱 Avoid screens 1 hour before bedtime for better sleep quality.",
            "☕ Limit caffeine after 2 PM to improve sleep quality.",
            "🧘 Try relaxation techniques like deep breathing or meditation before bed.",
            "🌙 Create a cool, dark, and quiet sleep environment.",
        ],
        motivation: [
            "🌟 Small daily habits lead to big changes over time. Stay consistent!",
            "🎯 Set realistic, achievable goals and celebrate small victories.",
            "🤝 Find a workout buddy or join a community for accountability.",
            "📊 Track your progress to see how far you've come.",
            "💪 Remember: Every step forward is progress, no matter how small.",
        ],
    };
    
    // Health fact database
    const facts = [
        "💡 Drinking water before meals can help reduce calorie intake.",
        "💡 Walking 10,000 steps daily can improve cardiovascular health.",
        "💡 Protein helps preserve muscle mass during weight loss.",
        "💡 Fiber-rich foods keep you full longer and aid digestion.",
        "💡 Strength training increases metabolism even at rest.",
        "💡 Sleep deprivation can increase cravings for unhealthy foods.",
        "💡 Mindfulness can help reduce emotional eating.",
        "💡 Spicy foods can temporarily boost metabolism.",
        "💡 Eating slowly helps you recognize fullness signals.",
        "💡 Healthy fats are essential for hormone function.",
    ];
    
    // Get goal-specific tips
    let goalTips = [];
    if (goal) {
        if (goal.goal === 'lose') goalTips = tips.weightLoss;
        else if (goal.goal === 'gain') goalTips = tips.weightGain;
        else if (goal.goal === 'maintain') goalTips = tips.nutrition;
    }
    
    // General tips if no goal or empty
    const generalTips = [
        ...tips.nutrition,
        ...tips.fitness,
        ...tips.sleep,
        ...tips.motivation,
        ...facts,
    ];
    
    // Select response based on message content
    const selectedTips = goalTips.length > 0 ? goalTips : generalTips;
    
    // Check for specific keywords
    if (lowerMsg.includes('weight') || lowerMsg.includes('lose') || lowerMsg.includes('fat')) {
        return `📝 ${selectedTips.slice(0, 3).join(' ')}`;
    }
    if (lowerMsg.includes('muscle') || lowerMsg.includes('gain') || lowerMsg.includes('bulk')) {
        return `💪 ${selectedTips.slice(0, 3).join(' ')}`;
    }
    if (lowerMsg.includes('sleep') || lowerMsg.includes('rest') || lowerMsg.includes('tired')) {
        return `😴 ${tips.sleep.slice(0, 3).join(' ')}`;
    }
    if (lowerMsg.includes('exercise') || lowerMsg.includes('workout') || lowerMsg.includes('gym')) {
        return `🏃 ${tips.fitness.slice(0, 3).join(' ')}`;
    }
    if (lowerMsg.includes('water') || lowerMsg.includes('drink') || lowerMsg.includes('hydrate')) {
        return `💧 ${tips.nutrition.slice(0, 3).join(' ')}`;
    }
    if (lowerMsg.includes('motivat') || lowerMsg.includes('encourage') || lowerMsg.includes('inspire')) {
        return `🌟 ${tips.motivation.slice(0, 3).join(' ')}`;
    }
    if (lowerMsg.includes('stress') || lowerMsg.includes('anxiety') || lowerMsg.includes('mental')) {
        return `🧘 Here are some stress management tips: Practice deep breathing for 5 minutes daily. Take short breaks during work. Regular exercise reduces stress hormones. Connect with friends and family. Consider meditation or journaling.`;
    }
    if (lowerMsg.includes('protein')) {
        return `🥩 Good protein sources include: chicken breast (31g/100g), eggs (13g/100g), Greek yogurt (10g/100g), lentils (9g/100g), and tofu (8g/100g). Aim for 1.6-2.2g per kg of body weight daily for muscle building.`;
    }
    if (lowerMsg.includes('calorie') || lowerMsg.includes('kcal')) {
        return `📊 ${goal?.targetDailyCalories ? `Your daily target is ${goal.targetDailyCalories} kcal. ` : ''}General calorie guidelines: Women need ~2000 kcal/day, Men ~2500 kcal/day for maintenance. Adjust based on your activity level and goals.`;
    }
    
    // Default response with a mix of tips
    const randomTips = selectedTips
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .join(' ');
    
    return `💚 ${randomTips}`;
}

// ============ MAIN FUNCTIONS ============

function getSystemPrompt(user, goal) {
    // ... same as before
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

    return `You are NutriAI, a professional health and nutrition assistant. 
Your role is to provide accurate, evidence-based health advice to help users achieve their wellness goals.

${userContext}
${goalContext}

Guidelines:
1. Be empathetic, encouraging, and supportive
2. Provide practical, actionable advice
3. Give specific examples and suggestions
4. If you don't know something, be honest about it
5. Never give medical advice - always recommend consulting a healthcare professional for serious concerns
6. Keep responses concise but informative (2-4 sentences per point)
7. Use a friendly, conversational tone
8. Format responses with clear structure using bullet points or numbered lists when helpful

Remember: You're helping someone improve their health. Be positive and motivating!`;
}

// ============ CHAT RESPONSE WITH FALLBACK ============

// Generate chat response (non-streaming) with fallback
export const generateChatResponse = async (message, user, goal) => {
    try {
        // ✅ Try OpenAI first
        const openai = getOpenAIClient();
        const systemPrompt = getSystemPrompt(user, goal);

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        return {
            message: response.choices[0].message.content,
            timestamp: new Date().toISOString(),
            source: "openai"
        };
    } catch (error) {
        // ✅ If OpenAI fails, use fallback
        console.warn('OpenAI unavailable, using fallback:', error.message);
        
        // Check if it's a quota/rate limit error
        if (error.message.includes('429')) {
            console.warn('⚠️ OpenAI quota exceeded, using fallback responses');
        }
        
        const fallbackMessage = getFallbackResponse(message, user, goal);
        return {
            message: fallbackMessage,
            timestamp: new Date().toISOString(),
            source: "fallback",
            note: "⚠️ Using offline health assistant (OpenAI temporarily unavailable)"
        };
    }
};

// Generate streaming chat response with fallback
export const generateHealthChatStream = async (message, user, goal, res) => {
    try {
        // ✅ Try OpenAI first
        const openai = getOpenAIClient();
        const systemPrompt = getSystemPrompt(user, goal);

        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 500,
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

        // Send complete response
        res.write(`event: complete\ndata: ${JSON.stringify({ 
            success: true,
            message: fullResponse,
            timestamp: new Date().toISOString(),
            source: "openai"
        })}\n\n`);

        res.write(`event: done\ndata: ${JSON.stringify({ 
            message: 'Response complete' 
        })}\n\n`);
        res.end();

    } catch (error) {
        // ✅ If OpenAI fails, use fallback
        console.warn('OpenAI stream unavailable, using fallback:', error.message);
        
        // Check if it's a quota/rate limit error
        if (error.message.includes('429')) {
            console.warn('⚠️ OpenAI quota exceeded, using fallback responses');
        }
        
        // Send fallback response with a note
        const fallbackMessage = getFallbackResponse(message, user, goal);
        const note = "⚠️ Using offline health assistant (OpenAI temporarily unavailable)";
        
        // Send note first
        res.write(`event: status\ndata: ${JSON.stringify({ 
            message: note 
        })}\n\n`);
        
        // Send fallback message in chunks
        const words = fallbackMessage.split(' ');
        let progress = 0;
        
        for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
            res.write(`event: chunk\ndata: ${JSON.stringify({ 
                chunk: chunk,
                progress: Math.min((i / words.length) * 100, 95)
            })}\n\n`);
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 30));
        }

        // Send complete response
        res.write(`event: complete\ndata: ${JSON.stringify({ 
            success: true,
            message: fallbackMessage,
            timestamp: new Date().toISOString(),
            source: "fallback",
            note: note
        })}\n\n`);

        res.write(`event: done\ndata: ${JSON.stringify({ 
            message: 'Response complete (offline mode)' 
        })}\n\n`);
        res.end();
    }
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
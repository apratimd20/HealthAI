
import Goal from "../models/goal.models.js";
import User from "../models/user.models.js";
import { generateChatResponse, generateHealthChatStream } from "../services/chat.services.js";
import { pythonAIService } from "../services/pythonAIService.js";

// Regular (non-streaming) chat
export const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        // Get user context for personalized responses
        const user = await User.findById(req.user._id);
        const goal = await Goal.findOne({
            user: req.user._id,
            status: "active",
        });

        const response = await generateChatResponse(message, user, goal);

        return res.status(200).json({
            success: true,
            data: response,
        });

    } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate chat response",
        });
    }
};

export const chatWithAIStream = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        // ✅ Get token from request headers
        const token = req.headers.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // ✅ Pass token to service
        const pythonResponse = await pythonAIService.sendMessageStream(message, token);
        
        if (!pythonResponse || !pythonResponse.body) {
            throw new Error('Failed to get response from AI service');
        }

        const reader = pythonResponse.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            res.write(chunk);
        }

        res.end();

    } catch (error) {
        console.error('Stream chat error:', error);
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to generate chat response",
            });
        }
        res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
        res.end();
    }
};

// Get chat history (optional)
export const getChatHistory = async (req, res) => {
    try {
        // You can implement chat history storage here
        // For now, return empty array or sample data
        return res.status(200).json({
            success: true,
            data: [],
            message: "Chat history feature coming soon",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get chat suggestions based on user context
export const getChatSuggestions = async (req, res) => {
    try {
        const goal = await Goal.findOne({
            user: req.user._id,
            status: "active",
        });

        const suggestions = generateSuggestions(goal);

        return res.status(200).json({
            success: true,
            data: suggestions,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Generate chat suggestions based on user goal
function generateSuggestions(goal) {
    const baseSuggestions = [
        "What's the best diet for weight loss?",
        "How much water should I drink daily?",
        "Give me a healthy breakfast recipe",
        "What are the best exercises for beginners?",
        "How can I improve my sleep quality?",
    ];

    if (!goal) return baseSuggestions;

    const goalSpecificSuggestions = {
        lose: [
            "How can I lose weight without feeling hungry?",
            "What are the best foods for weight loss?",
            "How many calories should I eat to lose weight?",
            "Give me a low-calorie dinner recipe",
            "How can I boost my metabolism?",
        ],
        gain: [
            "What foods help build muscle?",
            "How much protein do I need daily?",
            "Give me a high-calorie healthy meal plan",
            "What's the best pre-workout meal?",
            "How can I gain weight healthily?",
        ],
        maintain: [
            "How do I maintain my current weight?",
            "What's a balanced diet plan?",
            "Give me healthy snack ideas",
            "How often should I exercise?",
            "What are the best superfoods?",
        ],
    };

    return goalSpecificSuggestions[goal.goal] || baseSuggestions;
}
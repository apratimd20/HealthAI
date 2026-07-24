
import Goal from "../models/goal.models.js";
import User from "../models/user.models.js";
import { generateChatResponse, generateHealthChatStream } from "../services/chat.services.js";

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

// Streaming chat
export const chatWithAIStream = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        // Get user context
        const user = await User.findById(req.user._id);
        const goal = await Goal.findOne({
            user: req.user._id,
            status: "active",
        });

        // Set up SSE headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // Send initial status
        res.write(`event: status\ndata: ${JSON.stringify({ message: '🤖 Health AI is thinking...' })}\n\n`);

        // Generate streaming response
        await generateHealthChatStream(message, user, goal, res);

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
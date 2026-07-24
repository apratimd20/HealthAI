// routes/chat.route.js
import express from 'express';

import { authUser } from '../middleware/user.middleware.js';
import { chatWithAI, chatWithAIStream, getChatHistory, getChatSuggestions } from '../controllers/chat.controller.js';

const chatRouter = express.Router();

chatRouter.post('/chat', authUser, chatWithAI);
chatRouter.post('/chat-stream', authUser, chatWithAIStream);
chatRouter.get('/history', authUser, getChatHistory);
chatRouter.get('/suggestions', authUser, getChatSuggestions);

export default chatRouter;
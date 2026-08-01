// server.js
import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import './src/utils/cron.js';



connectDB();
const PORT = process.env.PORT || 5000;

console.log('🔑 AI config:', {
    groq: !!process.env.GROQ_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
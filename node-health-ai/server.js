// server.js
import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/db.js';
dotenv.config();



connectDB();
const PORT = process.env.PORT || 5000;


console.log('🔑 API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 8));

if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in .env');
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
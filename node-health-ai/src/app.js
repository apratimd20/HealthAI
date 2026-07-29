import express from 'express'
import cors from 'cors'

import { foodRouter } from './routes/food.route.js'
import { UserRouter } from './routes/user.route.js'
import { GoalRouter } from './routes/goal.route.js'
import chatRouter from './routes/chat.route.js'
import postRouter from './routes/post.route.js'

const app = express()

// ✅ UPDATED CORS SETUP WITH YOUR LIVE VERCEL URL
const allowedOrigins = [
    'http://localhost:3000',                 // For local React testing
    'http://localhost:5173',                 // For local Vite testing
    'https://health-ai-wine.vercel.app'      // 🟢 YOUR LIVE FRONTEND URL
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,  // Important for sending auth tokens
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token'],
}));

app.use(express.json())

app.get('/',(req,res)=>{
    res.json({
        success:true,
        message:"Backend is running "
    })
})

app.use('/api/food',foodRouter)
app.use('/api/user',UserRouter)
app.use('/api/health',GoalRouter)
app.use('/api/chat', chatRouter);
app.use('/api/posts', postRouter);

export default app 
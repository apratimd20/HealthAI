import express from 'express'
import cors from 'cors'

import { foodRouter } from './routes/food.route.js'
import { UserRouter } from './routes/user.route.js'
import { GoalRouter } from './routes/goal.route.js'
import chatRouter from './routes/chat.route.js'
import postRouter from './routes/post.route.js'
import { NotificationRouter } from './routes/notification.routes.js'

const app = express()

// ✅ UPDATED CORS SETUP WITH LOCALHOST & VERCEL URLS
const allowedOrigins = [
    'http://localhost:3000',                 
    'http://127.0.0.1:3000',                 
    'http://localhost:5173',                 
    'http://127.0.0.1:5173',                 
    'http://localhost:5174',                 
    'http://127.0.0.1:5174',                 
    'https://health-ai-wine.vercel.app'      
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or curl)
        if (!origin) return callback(null, true);
        
        if (
            allowedOrigins.indexOf(origin) !== -1 ||
            /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)
        ) {
            callback(null, true);
        } else {
            callback(null, false);
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
app.use('/api/notifications', NotificationRouter)

export default app 

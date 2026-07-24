import express from 'express'
import cors from 'cors'

import { foodRouter } from './routes/food.route.js'
import { UserRouter } from './routes/user.route.js'
import { GoalRouter } from './routes/goal.route.js'
import chatRouter from './routes/chat.route.js'

const app = express()

app.use(cors())
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

export default app 
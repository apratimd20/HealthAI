import express from "express"
import { loginUser, registerUser, userProfile } from "../controllers/user.controller.js"
import { authUser } from "../middleware/user.middleware.js"

export const UserRouter = express.Router()

UserRouter.post('/register',registerUser)
UserRouter.post('/login',loginUser)
UserRouter.get('/profile',authUser,userProfile)


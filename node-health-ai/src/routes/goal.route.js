import express from "express"
import { getActiveGoal, setGoal, cancelGoal, getNotifications, getSuggestions, getAIPlan } from "../controllers/goal.controller.js"
import { authUser } from "../middleware/user.middleware.js";
import { getTodayPlan, getWeeklyPlan } from "../controllers/plan.controller.js";

export const GoalRouter = express.Router()

GoalRouter.post('/setGoal', authUser, setGoal)
GoalRouter.post("/suggestions", getSuggestions);
GoalRouter.get("/ai-plan", authUser, getAIPlan);
GoalRouter.get("/activeGoal", authUser, getActiveGoal);
GoalRouter.get("/today", authUser, getTodayPlan);
GoalRouter.get("/weekly", authUser, getWeeklyPlan);
GoalRouter.put("/cancel", authUser, cancelGoal);
GoalRouter.get("/notifications", authUser, getNotifications);


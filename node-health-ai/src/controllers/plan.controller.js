// controllers/plan.controller.js
import Goal from "../models/goal.models.js";
import { generateDailyPlan } from "../services/plan.service.js";

export const getTodayPlan = async (req, res) => {
    try {
        // Find active goal
        const goal = await Goal.findOne({
            user: req.user._id,
            status: "active",
        });

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: "No active goal found. Please set a goal first.",
            });
        }

        // Generate daily plan
        const plan = await generateDailyPlan(goal);

        return res.status(200).json({
            success: true,
            message: "Today's plan generated successfully.",
            data: plan,
        });

    } catch (error) {
        console.error('Get today plan error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate today's plan",
        });
    }
};

export const getWeeklyPlan = async (req, res) => {
    try {
        const goal = await Goal.findOne({
            user: req.user._id,
            status: "active",
        });

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: "No active goal found.",
            });
        }

        // Generate plan for 7 days
        const weeklyPlan = [];
        for (let i = 0; i < 7; i++) {
            const plan = await generateDailyPlan(goal);
            weeklyPlan.push({
                day: i + 1,
                date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString(),
                ...plan
            });
        }

        return res.status(200).json({
            success: true,
            message: "Weekly plan generated successfully.",
            data: weeklyPlan,
        });

    } catch (error) {
        console.error('Get weekly plan error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate weekly plan",
        });
    }
};
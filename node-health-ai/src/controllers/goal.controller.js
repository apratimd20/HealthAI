


import Goal from "./../models/goal.models.js";
import { generateDailyPlan } from "../services/plan.service.js";
import { getGoalSuggestions, generateAIPlan } from "../services/aiPlan.service.js";

// Helper function for BMI category
function getBMICategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

// Helper function to calculate BMR
function calculateBMR(gender, age, height, weight) {
  if (gender === 'Male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
}

export const setGoal = async (req, res) => {
  try {
    const {
      // Basic Info
      age,
      gender,
      height,
      weight,
      targetWeight,
      goal,
      activityLevel,
      
      // Lifestyle & Schedule
      sleepHours,
      wakeTime,
      sleepTime,
      workStart,
      workEnd,
      
      // Dietary Preferences
      foodPreference,
      mealFrequency,
      waterIntake,
      
      // Health Conditions
      medicalConditions,
      allergies,
      
      // Fitness
      exerciseDays,
      preferredWorkoutType,
      
      // Preferences
      cuisinePreference,
      cookingTimePreference,
    } = req.body;

    // ============ VALIDATE REQUIRED FIELDS ============
    const requiredFields = [
      'age', 'gender', 'height', 'weight', 
      'targetWeight', 'goal', 'activityLevel'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // ============ VALIDATE RANGES ============
    if (age < 10 || age > 120) {
      return res.status(400).json({
        success: false,
        message: "Age must be between 10 and 120",
      });
    }

    if (height < 50 || height > 300) {
      return res.status(400).json({
        success: false,
        message: "Height must be between 50 and 300 cm",
      });
    }

    if (weight < 20 || weight > 500) {
      return res.status(400).json({
        success: false,
        message: "Weight must be between 20 and 500 kg",
      });
    }

    if (targetWeight < 20 || targetWeight > 500) {
      return res.status(400).json({
        success: false,
        message: "Target weight must be between 20 and 500 kg",
      });
    }

    // ============ SMART VALIDATIONS ============
    
    // 1. Calculate BMI and BMR
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    const bmiCategory = getBMICategory(bmi);
    const weightDiff = targetWeight - weight;
    const bmr = calculateBMR(gender, age, height, weight);
    
    // 2. Check if goal matches weight direction
    if (goal === 'lose' && weightDiff >= 0) {
      return res.status(400).json({
        success: false,
        message: "Your target weight is higher than current weight. Did you mean to select 'Gain Weight'?",
        suggestion: "gain",
      });
    }
    
    if (goal === 'gain' && weightDiff <= 0) {
      return res.status(400).json({
        success: false,
        message: "Your target weight is lower than current weight. Did you mean to select 'Lose Weight'?",
        suggestion: "lose",
      });
    }
    
    if (goal === 'maintain' && Math.abs(weightDiff) > 5) {
      return res.status(400).json({
        success: false,
        message: "For 'Maintain' goal, target weight should be within 5kg of current weight.",
        suggestion: "lose",
      });
    }
    
    // 3. Check if target is too aggressive
    const maxLoss = weight * 0.15;
    const maxGain = weight * 0.20;
    
    if (goal === 'lose' && Math.abs(weightDiff) > maxLoss) {
      return res.status(400).json({
        success: false,
        message: `Losing ${Math.abs(weightDiff).toFixed(1)}kg may be too aggressive. We recommend a maximum of ${maxLoss.toFixed(1)}kg for safe weight loss.`,
        suggestion: "less_aggressive",
      });
    }
    
    if (goal === 'gain' && weightDiff > maxGain) {
      return res.status(400).json({
        success: false,
        message: `Gaining ${weightDiff.toFixed(1)}kg may be too aggressive. We recommend a maximum of ${maxGain.toFixed(1)}kg for safe weight gain.`,
        suggestion: "less_aggressive",
      });
    }
    
    // 4. Health warnings based on BMI
    if (bmi < 18.5 && goal === 'lose') {
      return res.status(400).json({
        success: false,
        message: "⚠️ You're already underweight. Losing more weight may be unhealthy. We recommend consulting a doctor.",
        suggestion: "gain_or_maintain",
        bmi: parseFloat(bmi.toFixed(1)),
        bmiCategory: bmiCategory,
      });
    }
    
    if (bmi > 35 && goal === 'gain') {
      return res.status(400).json({
        success: false,
        message: "⚠️ You're in the obese range. Gaining weight may increase health risks. We recommend 'Lose Weight' or consulting a doctor.",
        suggestion: "lose",
        bmi: parseFloat(bmi.toFixed(1)),
        bmiCategory: bmiCategory,
      });
    }

    // 5. Check if target weight is healthy for height
    const minHealthyWeight = 18.5 * (heightInMeters * heightInMeters);
    const maxHealthyWeight = 24.9 * (heightInMeters * heightInMeters);
    
    if (targetWeight < minHealthyWeight * 0.8) {
      return res.status(400).json({
        success: false,
        message: `⚠️ Your target weight (${targetWeight}kg) may be too low for your height. The healthy weight range is ${minHealthyWeight.toFixed(1)} - ${maxHealthyWeight.toFixed(1)} kg.`,
        suggestion: "adjust_target",
      });
    }

    // ============ DEACTIVATE PREVIOUS GOAL(S) ============
    await Goal.updateMany(
      {
        user: req.user._id,
        status: "active",
      },
      {
        status: "inactive",
        deactivatedAt: new Date(),
      }
    );

    // ============ CREATE NEW GOAL ============
    // ✅ Calculate BMR before creating the goal
    const calculatedBmr = calculateBMR(gender, age, height, weight);
    
    const newGoal = await Goal.create({
      user: req.user._id,
      
      // Basic Info
      age,
      gender,
      height,
      weight,
      targetWeight,
      goal,
      activityLevel,
      
      // Lifestyle & Schedule
      sleepHours: sleepHours || 8,
      wakeTime: wakeTime || "06:00",
      sleepTime: sleepTime || "22:00",
      workStart: workStart || "09:00",
      workEnd: workEnd || "18:00",
      
      // Dietary Preferences
      foodPreference: foodPreference || 'non-vegetarian',
      mealFrequency: mealFrequency || 3,
      waterIntake: waterIntake || 2.5,
      
      // Health Conditions
      medicalConditions: medicalConditions || [],
      allergies: allergies || [],
      
      // Fitness
      exerciseDays: exerciseDays || 3,
      preferredWorkoutType: preferredWorkoutType || 'mixed',
      
      // Preferences
      cuisinePreference: cuisinePreference || 'all',
      cookingTimePreference: cookingTimePreference || 'medium',
      
      // Metadata - ✅ Use calculated values
      bmiAtCreation: parseFloat(bmi.toFixed(1)),
      bmrAtCreation: calculatedBmr,  // ✅ Now this works
      status: "active",
    });

    // ============ GENERATE INITIAL PLAN ============
    const plan = await generateDailyPlan(newGoal);

    return res.status(201).json({
      success: true,
      message: "Goal created successfully",
      data: {
        goal: newGoal,
        plan: plan,
        bmi: parseFloat(bmi.toFixed(1)),
        bmiCategory: bmiCategory,
        bmr: calculatedBmr,
      },
    });

  } catch (error) {
    console.error('Set goal error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create goal",
    });
  }
};

export const getSuggestions = async (req, res) => {
    try {
        const { age, gender, height, weight } = req.body;
        if (!age || !gender || !height || !weight) {
            return res.status(400).json({ success: false, message: "age, gender, height, weight are required" });
        }
        const suggestions = await getGoalSuggestions(age, gender, height, weight);
        return res.status(200).json({ success: true, data: suggestions });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAIPlan = async (req, res) => {
    try {
        const goal = await Goal.findOne({ user: req.user._id, status: "active" });
        if (!goal) return res.status(404).json({ success: false, message: "No active goal" });

        const aiPlan = await generateAIPlan(goal);
        if (!aiPlan) return res.status(503).json({ success: false, message: "AI plan unavailable, using standard plan" });

        const plan = await generateDailyPlan(goal);
        return res.status(200).json({ success: true, data: { ...plan, aiPlan } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getActiveGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "No active goal found",
      });
    }

    return res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelGoal = async (req, res) => {
  try {
    const result = await Goal.updateMany(
      {
        user: req.user._id,
        status: "active",
      },
      {
        status: "inactive",
        deactivatedAt: new Date(),
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No active goal found to cancel",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Goal cancelled successfully",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const goalId = req.params.id;
    const updates = req.body;

    const goal = await Goal.findOneAndUpdate(
      {
        _id: goalId,
        user: req.user._id,
        status: "active",
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found or not active",
      });
    }

    // Regenerate plan with updated goal
    const plan = await generateDailyPlan(goal);

    return res.status(200).json({
      success: true,
      message: "Goal updated successfully",
      data: {
        goal,
        plan,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getGoalHistory = async (req, res) => {
  try {
    const goals = await Goal.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: goals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    let hour = parseInt(req.query.hour);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      hour = new Date().getHours();
    }

    const goal = await Goal.findOne({
      user: req.user._id,
      status: "active",
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "No active goal found",
      });
    }

    const foodPreference = goal.foodPreference || "non-vegetarian";
    const recommendations = [];

    // ============ TIME-BASED RECOMMENDATIONS ============
    const mealTimes = {
      breakfast: { start: 6, end: 10 },
      lunch: { start: 12, end: 15 },
      snack: { start: 16, end: 18 },
      dinner: { start: 19, end: 22 },
    };

    const getMealRecommendation = (mealType, preference) => {
      const meals = {
        vegetarian: {
          breakfast: [
            "Oatmeal with berries and nuts",
            "Whole grain toast with avocado",
            "Vegetable omelette with spinach",
            "Greek yogurt with granola",
          ],
          lunch: [
            "Chickpea salad wrap",
            "Quinoa and roasted vegetable bowl",
            "Lentil soup with whole grain bread",
            "Vegetable stir-fry with brown rice",
          ],
          dinner: [
            "Grilled vegetable pasta",
            "Sweet potato and black bean bowl",
            "Mushroom risotto",
            "Mediterranean vegetable platter",
          ],
          snack: [
            "Apple slices with peanut butter",
            "Trail mix (nuts and dried fruits)",
            "Vegetable sticks with hummus",
            "Whole grain crackers with cheese",
          ],
        },
        "non-vegetarian": {
          breakfast: [
            "Scrambled eggs with whole grain toast",
            "Grilled chicken breast with vegetables",
            "Salmon and avocado toast",
            "High protein omelette",
          ],
          lunch: [
            "Grilled chicken Caesar salad",
            "Tuna and quinoa bowl",
            "Turkey and avocado wrap",
            "Chicken and vegetable stir-fry",
          ],
          dinner: [
            "Grilled salmon with quinoa",
            "Chicken breast with roasted vegetables",
            "Lean beef with sweet potato",
            "Turkey and vegetable casserole",
          ],
          snack: [
            "Hard-boiled eggs",
            "Protein shake with fruit",
            "Turkey or chicken jerky",
            "Cottage cheese with berries",
          ],
        },
        vegan: {
          breakfast: [
            "Vegan smoothie bowl",
            "Chia seed pudding with almond milk",
            "Tofu scramble with vegetables",
            "Vegan banana pancakes",
          ],
          lunch: [
            "Chickpea and vegetable curry",
            "Tofu and vegetable stir-fry",
            "Vegan quinoa salad",
            "Lentil and vegetable soup",
          ],
          dinner: [
            "Vegan lentil bolognese",
            "Tempeh and vegetable skewers",
            "Vegan mushroom risotto",
            "Black bean and sweet potato bowl",
          ],
          snack: [
            "Fruit and nut bars",
            "Hummus with vegetable sticks",
            "Vegan protein smoothie",
            "Roasted chickpeas",
          ],
        },
      };
      return meals[preference]?.[mealType] || meals["non-vegetarian"][mealType];
    };

    // Time-based recommendations
    if (hour >= mealTimes.breakfast.start && hour < mealTimes.breakfast.end) {
      const options = getMealRecommendation('breakfast', foodPreference.toLowerCase());
      recommendations.push({
        type: "eat",
        text: `🌅 Breakfast time! Choose from: ${options.slice(0, 2).join(' or ')}.`,
        category: "Breakfast",
        priority: "high",
      });
      recommendations.push({
        type: "drink",
        text: "💧 Start your day with 500ml of water to rehydrate.",
        category: "Hydration",
        priority: "high",
      });
    } else if (hour >= mealTimes.lunch.start && hour < mealTimes.lunch.end) {
      const options = getMealRecommendation('lunch', foodPreference.toLowerCase());
      recommendations.push({
        type: "eat",
        text: `🥗 Lunch time! Try: ${options.slice(0, 2).join(' or ')}.`,
        category: "Lunch",
        priority: "high",
      });
      recommendations.push({
        type: "drink",
        text: "💧 Have 300ml of water with your meal.",
        category: "Hydration",
        priority: "medium",
      });
    } else if (hour >= mealTimes.snack.start && hour < mealTimes.snack.end) {
      const options = getMealRecommendation('snack', foodPreference.toLowerCase());
      recommendations.push({
        type: "eat",
        text: `🍎 Healthy snack break: ${options.slice(0, 2).join(' or ')}.`,
        category: "Snack",
        priority: "medium",
      });
    } else if (hour >= mealTimes.dinner.start && hour < mealTimes.dinner.end) {
      const options = getMealRecommendation('dinner', foodPreference.toLowerCase());
      recommendations.push({
        type: "eat",
        text: `🌙 Dinner suggestion: ${options.slice(0, 2).join(' or ')}.`,
        category: "Dinner",
        priority: "high",
      });
      recommendations.push({
        type: "sleep",
        text: `😴 Aim to finish eating 2-3 hours before bed. Target sleep: ${goal.sleepHours || 8}h.`,
        category: "Sleep",
        priority: "high",
      });
    } else {
      recommendations.push({
        type: "sleep",
        text: `🌙 Wind down time! Prepare for ${goal.sleepHours || 8} hours of quality sleep.`,
        category: "Sleep",
        priority: "high",
      });
    }

    // Hydration reminder
    const waterNeeded = goal.waterIntake || 2.5;
    recommendations.push({
      type: "drink",
      text: `💧 Daily water target: ${waterNeeded}L. You're ${Math.round((hour / 24) * 100)}% through your day!`,
      category: "Hydration",
      priority: "medium",
    });

    // Exercise reminder
    const exerciseDays = goal.exerciseDays || 3;
    const today = new Date().getDay();
    const exerciseSchedule = [1, 3, 5];
    if (exerciseSchedule.includes(today)) {
      recommendations.push({
        type: "exercise",
        text: `🏋️ Workout day! Your ${goal.preferredWorkoutType || 'mixed'} workout is scheduled today.`,
        category: "Fitness",
        priority: "medium",
      });
    }

    // Health reminders
    if (goal.medicalConditions && goal.medicalConditions.length > 0) {
      recommendations.push({
        type: "health",
        text: `🏥 Remember to manage your ${goal.medicalConditions.join(', ')}. Stay consistent with your health routine.`,
        category: "Health",
        priority: "high",
      });
    }

    return res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Notifications error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
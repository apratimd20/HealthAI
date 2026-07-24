// services/plan.service.js
import {
    calculateBMI,
    calculateBMR,
    calculateTDEE,
    calculateCalories,
    calculateWaterIntake,
    getSleepRecommendation
} from "./health.services.js";

import {
    getMealTemplate,
    getWorkoutTemplate
} from "./recommendation.service.js";

import {
    generateMeals
} from "./meal.service.js";

import {
    generateWorkout
} from "./workout.service.js";

export const generateDailyPlan = async (goalData) => {
    try {
        console.log('📊 Generating plan for goal:', goalData._id);

        // Calculate health metrics
        const bmi = calculateBMI(goalData.height, goalData.weight);
        const bmr = calculateBMR(
            goalData.gender,
            goalData.age,
            goalData.height,
            goalData.weight
        );
        const tdee = calculateTDEE(bmr, goalData.activityLevel);
        const calories = calculateCalories(tdee, goalData.goal);

        // Get templates
        const mealTemplate = getMealTemplate(
            goalData.goal,
            bmi,
            goalData.activityLevel,
            goalData.foodPreference
        );

        const workoutTemplate = getWorkoutTemplate(
            goalData.goal,
            goalData.activityLevel
        );

        // Generate meals and workout
        const meals = await generateMeals(
            calories,
            goalData.foodPreference,
            mealTemplate,
            goalData.mealFrequency || 3,
            goalData
        );

        const workout = await generateWorkout(
            goalData.goal,
            goalData.activityLevel,
            workoutTemplate,
            goalData.exerciseDays || 3,
            goalData.preferredWorkoutType || 'mixed'
        );

        // Calculate macros
        const macros = calculateMacros(calories, goalData.goal);

        return {
            bmi: parseFloat(bmi.toFixed(1)),
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            calories: Math.round(calories),
            water: calculateWaterIntake(goalData.weight),
            sleep: getSleepRecommendation(goalData.sleepHours || 8),
            macros: macros,
            meals: meals,
            workout: workout,
            summary: generateSummary(goalData, bmi, calories),
        };

    } catch (error) {
        console.error('Plan generation error:', error);
        throw new Error(`Failed to generate plan: ${error.message}`);
    }
};

// Helper function to calculate macros
function calculateMacros(calories, goalType) {
    let proteinRatio, carbRatio, fatRatio;
    
    switch (goalType) {
        case 'lose':
            proteinRatio = 0.40;
            carbRatio = 0.30;
            fatRatio = 0.30;
            break;
        case 'gain':
            proteinRatio = 0.30;
            carbRatio = 0.40;
            fatRatio = 0.30;
            break;
        case 'maintain':
            proteinRatio = 0.30;
            carbRatio = 0.40;
            fatRatio = 0.30;
            break;
        default:
            proteinRatio = 0.30;
            carbRatio = 0.40;
            fatRatio = 0.30;
    }

    return {
        protein: Math.round((calories * proteinRatio) / 4),
        carbs: Math.round((calories * carbRatio) / 4),
        fat: Math.round((calories * fatRatio) / 9),
        fiber: Math.round(calories / 1000 * 14), // 14g per 1000 calories
    };
}

// Helper function to generate summary
function generateSummary(goalData, bmi, calories) {
    const bmiCategory = getBMICategory(bmi);
    const goalEmoji = goalData.goal === 'lose' ? '🏋️' : 
                      goalData.goal === 'gain' ? '💪' : '⚖️';
    
    return {
        title: `${goalEmoji} ${goalData.goal.charAt(0).toUpperCase() + goalData.goal.slice(1)} Weight Plan`,
        bmiCategory: bmiCategory,
        dailyCalories: `${Math.round(calories)} kcal`,
        description: `Based on your ${goalData.activityLevel} lifestyle and ${goalData.goal} weight goal.`,
        recommendations: getRecommendations(goalData.goal, bmiCategory)
    };
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
}

function getRecommendations(goalType, bmiCategory) {
    const base = [
        'Stay consistent with your daily plan',
        'Drink plenty of water throughout the day',
        'Get 7-9 hours of quality sleep'
    ];
    
    if (goalType === 'lose') {
        return [...base, 'Focus on portion control', 'Include protein in every meal'];
    } else if (goalType === 'gain') {
        return [...base, 'Eat calorie-dense foods', 'Focus on strength training'];
    } else {
        return [...base, 'Maintain balanced meals', 'Stay active daily'];
    }
}
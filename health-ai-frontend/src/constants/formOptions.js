// src/constants/formOptions.js

// ============ BASIC INFO ============
export const genders = [
    { value: 'Male', label: '👨 Male' },
    { value: 'Female', label: '👩 Female' },
    { value: 'Other', label: '👤 Other' }
];

// ============ GOALS ============
export const goals = [
    { value: 'lose', label: '🏋️ Lose Weight' },
    { value: 'gain', label: '💪 Gain Weight' },
    { value: 'maintain', label: '⚖️ Maintain Weight' }
];

// ============ ACTIVITY LEVELS ============
export const activityLevels = [
    { value: 'sedentary', label: '🪑 Sedentary (Little or no exercise)' },
    { value: 'light', label: '🚶 Light (Exercise 1-3 days/week)' },
    { value: 'moderate', label: '🏃 Moderate (Exercise 3-5 days/week)' },
    { value: 'active', label: '💪 Active (Exercise 6-7 days/week)' },
    { value: 'very_active', label: '🔥 Very Active (Hard exercise daily)' }
];

// ============ DIETARY PREFERENCES ============
export const foodPreferences = [
    { value: 'non-vegetarian', label: '🍖 Non-Vegetarian' },
    { value: 'vegetarian', label: '🥬 Vegetarian' },
    { value: 'vegan', label: '🌱 Vegan' }
];

// ============ LIFESTYLE ============
export const stressLevels = [
    { value: 'low', label: '😌 Low' },
    { value: 'medium', label: '😐 Medium' },
    { value: 'high', label: '😰 High' }
];

export const smokingStatuses = [
    { value: 'never', label: '🚭 Never' },
    { value: 'former', label: '🚬 Former Smoker' },
    { value: 'current', label: '🚬 Current Smoker' }
];

export const alcoholOptions = [
    { value: 'never', label: '🚫 Never' },
    { value: 'rarely', label: '🍷 Rarely' },
    { value: 'sometimes', label: '🍺 Sometimes' },
    { value: 'regularly', label: '🍸 Regularly' }
];

// ============ FITNESS ============
export const workoutTypes = [
    { value: 'cardio', label: '🏃 Cardio' },
    { value: 'strength', label: '🏋️ Strength Training' },
    { value: 'yoga', label: '🧘 Yoga / Pilates' },
    { value: 'mixed', label: '🔄 Mixed (Combination)' }
];

// ============ CUISINE PREFERENCES ============
export const cuisinePreferences = [
    { value: 'all', label: '🌍 All Cuisines' },
    { value: 'indian', label: '🇮🇳 Indian' },
    { value: 'chinese', label: '🇨🇳 Chinese' },
    { value: 'italian', label: '🇮🇹 Italian' },
    { value: 'mexican', label: '🇲🇽 Mexican' },
    { value: 'japanese', label: '🇯🇵 Japanese' },
    { value: 'mediterranean', label: '🇬🇷 Mediterranean' },
    { value: 'thai', label: '🇹🇭 Thai' },
    { value: 'american', label: '🇺🇸 American' },
    { value: 'middle_eastern', label: '🇸🇦 Middle Eastern' }
];

// ============ COOKING TIME ============
export const cookingTimeOptions = [
    { value: 'quick', label: '⏱️ Quick (under 15 mins)' },
    { value: 'medium', label: '⏰ Medium (15-30 mins)' },
    { value: 'elaborate', label: '🍳 Elaborate (30+ mins)' }
];

// ============ BUDGET ============
export const budgetOptions = [
    { value: 'low', label: '💰 Budget Friendly' },
    { value: 'medium', label: '💵 Moderate' },
    { value: 'high', label: '💎 Premium' }
];

// ============ MEAL FREQUENCY ============
export const mealFrequencyOptions = [
    { value: 2, label: '2 meals/day (Intermittent Fasting)' },
    { value: 3, label: '3 meals/day (Standard)' },
    { value: 4, label: '4 meals/day (Small + frequent)' },
    { value: 5, label: '5 meals/day (Bodybuilder style)' },
    { value: 6, label: '6 meals/day (Very frequent)' }
];

// ============ WATER INTAKE ============
export const waterIntakeOptions = [
    { value: 1.5, label: '1.5 L (Minimum)' },
    { value: 2.0, label: '2.0 L (Recommended)' },
    { value: 2.5, label: '2.5 L (Active lifestyle)' },
    { value: 3.0, label: '3.0 L (Very active)' },
    { value: 3.5, label: '3.5 L (Athlete)' },
    { value: 4.0, label: '4.0 L (High intensity)' }
];

// ============ EXERCISE DAYS ============
export const exerciseDaysOptions = [
    { value: 0, label: '0 days (Rest)' },
    { value: 1, label: '1 day/week' },
    { value: 2, label: '2 days/week' },
    { value: 3, label: '3 days/week (Recommended)' },
    { value: 4, label: '4 days/week' },
    { value: 5, label: '5 days/week (Active)' },
    { value: 6, label: '6 days/week (Very active)' },
    { value: 7, label: '7 days/week (Athlete)' }
];

// ============ SLEEP HOURS ============
export const sleepHoursOptions = [
    { value: 4, label: '4 hours' },
    { value: 5, label: '5 hours' },
    { value: 6, label: '6 hours' },
    { value: 7, label: '7 hours (Recommended)' },
    { value: 8, label: '8 hours (Optimal)' },
    { value: 9, label: '9 hours' },
    { value: 10, label: '10 hours' }
];

// ============ HELPER FUNCTIONS ============
// Get label from value
export const getLabel = (options, value) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
};

// Get options for select field
export const getOptions = (options) => {
    return options.map(opt => ({
        value: opt.value,
        label: opt.label
    }));
};


export default {
    genders,
    goals,
    activityLevels,
    foodPreferences,
    stressLevels,
    smokingStatuses,
    alcoholOptions,
    workoutTypes,
    cuisinePreferences,
    cookingTimeOptions,
    budgetOptions,
    mealFrequencyOptions,
    waterIntakeOptions,
    exerciseDaysOptions,
    sleepHoursOptions,
    getLabel,
    getOptions
};
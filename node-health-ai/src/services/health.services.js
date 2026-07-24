// // Calculate BMI
// export const calculateBMI = (height, weight) => {
//     const heightInMeter = height / 100;

//     const bmi = weight / (heightInMeter * heightInMeter);

//     return Number(bmi.toFixed(2));
// };

// // Calculate BMR
// export const calculateBMR = (gender, age, height, weight) => {

//     if (gender === "Male") {
//         return Math.round(
//             (10 * weight) +
//             (6.25 * height) -
//             (5 * age) +
//             5
//         );
//     }

//     if (gender === "Female") {
//         return Math.round(
//             (10 * weight) +
//             (6.25 * height) -
//             (5 * age) -
//             161
//         );
//     }

//     // Other
//     return Math.round(
//         (10 * weight) +
//         (6.25 * height) -
//         (5 * age)
//     );
// };

// // Calculate TDEE
// export const calculateTDEE = (bmr, activityLevel) => {

//     const activityMultiplier = {
//         Sedentary: 1.2,
//         Light: 1.375,
//         Moderate: 1.55,
//         Active: 1.725,
//         "Very Active": 1.9,
//     };

//     const multiplier = activityMultiplier[activityLevel] || 1.2;

//     return Math.round(bmr * multiplier);
// };

// // Calculate Daily Calories
// export const calculateCalories = (tdee, goal) => {

//     switch (goal) {

//         case "Lose Weight":
//             return tdee - 500;

//         case "Gain Weight":
//             return tdee + 500;

//         case "Build Muscle":
//             return tdee + 300;

//         case "Maintain Weight":
//             return tdee;

//         default:
//             return tdee;
//     }
// };

// // Water Intake
// export const calculateWaterIntake = (weight) => {

//     const water = weight * 35;

//     return `${(water / 1000).toFixed(1)} L`;
// };

// // Sleep Recommendation
// export const getSleepRecommendation = () => {

//     return {
//         duration: "8 Hours",
//         bedtime: "10:30 PM",
//         wakeUp: "6:30 AM",
//     };
// };



// services/health.services.js

// Calculate BMI
export const calculateBMI = (height, weight) => {
    if (!height || !weight) return 0;
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
};

// Calculate BMR (Mifflin-St Jeor Equation)
export const calculateBMR = (gender, age, height, weight) => {
    if (!gender || !age || !height || !weight) return 0;
    let bmr;
    if (gender === 'Male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    return bmr;
};

// Calculate TDEE
export const calculateTDEE = (bmr, activityLevel) => {
    if (!bmr || !activityLevel) return 0;
    const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
    };
    return bmr * (multipliers[activityLevel] || 1.55);
};

// Calculate daily calories based on goal
export const calculateCalories = (tdee, goal) => {
    if (!tdee || !goal) return tdee || 2000;
    let adjustment = 0;
    switch (goal) {
        case 'lose':
            adjustment = -500;
            break;
        case 'gain':
            adjustment = 500;
            break;
        case 'maintain':
            adjustment = 0;
            break;
        default:
            adjustment = 0;
    }
    return Math.max(tdee + adjustment, 1200);
};

// Calculate water intake
export const calculateWaterIntake = (weight) => {
    if (!weight) return 2.5;
    // 30-40 ml per kg of body weight
    const base = weight * 0.033;
    return parseFloat(Math.round(base * 10) / 10);
};

// Get sleep recommendation
export const getSleepRecommendation = (sleepHours) => {
    const hours = sleepHours || 8;
    const bedtime = new Date();
    bedtime.setHours(22, 30, 0, 0); // Default 10:30 PM
    
    const wakeTime = new Date(bedtime);
    wakeTime.setHours(wakeTime.getHours() + hours);
    
    return {
        duration: `${hours} hours`,
        bedtime: bedtime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }),
        wakeTime: wakeTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }),
        recommendation: hours >= 7 && hours <= 9 ? 
            'Optimal sleep duration for adults' :
            hours < 7 ? 'Consider increasing sleep for better recovery' :
            'Good sleep duration'
    };
};

// Calculate macros
export const calculateMacros = (calories, goal) => {
    let proteinRatio, carbRatio, fatRatio;
    
    switch (goal) {
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
        fiber: Math.round(calories / 1000 * 14),
    };
};
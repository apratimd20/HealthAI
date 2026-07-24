// Decide Meal Template
export const getMealTemplate = (
    goal,
    bmi,
    activityLevel,
    foodPreference
) => {

    // Weight Loss
    if (goal === "Lose Weight") {

        if (bmi >= 30) {
            return "Weight Loss Advanced";
        }

        if (bmi >= 25) {
            return "Weight Loss Intermediate";
        }

        return "Weight Loss Beginner";
    }

    // Muscle Gain
    if (goal === "Build Muscle") {
        return "Muscle Gain";
    }

    // Weight Gain
    if (goal === "Gain Weight") {
        return "Weight Gain";
    }

    // Maintain Weight
    return "Maintenance";
};

// Decide Workout Template
export const getWorkoutTemplate = (
    goal,
    activityLevel
) => {

    if (goal === "Lose Weight") {

        if (activityLevel === "Sedentary") {
            return "Weight Loss Beginner Workout";
        }

        return "Weight Loss Intermediate Workout";
    }

    if (goal === "Build Muscle") {
        return "Muscle Gain Workout";
    }

    if (goal === "Gain Weight") {
        return "Weight Gain Workout";
    }

    return "Maintenance Workout";
};
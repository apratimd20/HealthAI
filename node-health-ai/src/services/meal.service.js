import Food from "../models/food.model.js";

/**
 * Generate foods for a specific meal
 */
const getFoodsForMeal = async (
  mealType,
  targetCalories,
  foodPreference
) => {
  // Fetch foods for this meal
  const foods = await Food.find({
    mealType,
    foodPreference,
    isActive: true,
  }).select("-__v");

  if (!foods.length) {
    return {
      foods: [],
      totalCalories: 0,
      targetCalories,
    };
  }

  const selectedFoods = [];
  let totalCalories = 0;

  // Simple algorithm:
  // Keep adding foods until target calories are reached
  for (const food of foods) {
    if (totalCalories >= targetCalories) break;

    selectedFoods.push(food);

    totalCalories += food.calories;
  }

  return {
    foods: selectedFoods,
    totalCalories,
    targetCalories,
  };
};

/**
 * Breakfast
 */
export const generateBreakfast = async (
  calories,
  foodPreference
) => {
  return await getFoodsForMeal(
    "Breakfast",
    calories,
    foodPreference
  );
};

/**
 * Lunch
 */
export const generateLunch = async (
  calories,
  foodPreference
) => {
  return await getFoodsForMeal(
    "Lunch",
    calories,
    foodPreference
  );
};

/**
 * Snacks
 */
export const generateSnacks = async (
  calories,
  foodPreference
) => {
  return await getFoodsForMeal(
    "Snacks",
    calories,
    foodPreference
  );
};

/**
 * Dinner
 */
export const generateDinner = async (
  calories,
  foodPreference
) => {
  return await getFoodsForMeal(
    "Dinner",
    calories,
    foodPreference
  );
};

/**
 * Generate Complete Meal Plan
 */
export const generateMeals = async (
  totalCalories,
  foodPreference
) => {

  const breakfastCalories = Math.round(totalCalories * 0.25);

  const lunchCalories = Math.round(totalCalories * 0.35);

  const snackCalories = Math.round(totalCalories * 0.10);

  const dinnerCalories = Math.round(totalCalories * 0.30);

  const breakfast = await generateBreakfast(
    breakfastCalories,
    foodPreference
  );

  const lunch = await generateLunch(
    lunchCalories,
    foodPreference
  );

  const snacks = await generateSnacks(
    snackCalories,
    foodPreference
  );

  const dinner = await generateDinner(
    dinnerCalories,
    foodPreference
  );

  return {
    breakfast,
    lunch,
    snacks,
    dinner,
  };
};
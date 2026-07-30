import Food from "../models/food.model.js";

/**
 * Generate foods for a specific meal
 */
// Fallback food items if database query yields empty results
const defaultFallbackFoods = {
  Breakfast: [
    { name: "Oatmeal with Berries & Almonds", calories: 350, protein: 12, carbs: 55, fat: 8, servingSize: 1, servingUnit: "bowl", category: "Grains" },
    { name: "Scrambled Eggs with Avocado Toast", calories: 420, protein: 22, carbs: 32, fat: 20, servingSize: 1, servingUnit: "plate", category: "Protein" },
    { name: "Greek Yogurt with Honey & Granola", calories: 300, protein: 18, carbs: 40, fat: 6, servingSize: 1, servingUnit: "bowl", category: "Dairy" }
  ],
  Lunch: [
    { name: "Grilled Chicken Quinoa Bowl", calories: 550, protein: 42, carbs: 50, fat: 14, servingSize: 1, servingUnit: "bowl", category: "Protein" },
    { name: "Chickpea & Roasted Vegetable Salad", calories: 450, protein: 16, carbs: 62, fat: 12, servingSize: 1, servingUnit: "bowl", category: "Legumes" },
    { name: "Turkey & Whole Grain Avocado Wrap", calories: 480, protein: 32, carbs: 45, fat: 16, servingSize: 1, servingUnit: "wrap", category: "Protein" }
  ],
  Snacks: [
    { name: "Apple Slices with Peanut Butter", calories: 200, protein: 6, carbs: 24, fat: 10, servingSize: 1, servingUnit: "serving", category: "Fruits" },
    { name: "Mixed Roasted Nuts & Seeds", calories: 180, protein: 7, carbs: 8, fat: 15, servingSize: 1, servingUnit: "handful", category: "Nuts" },
    { name: "Protein Smoothie", calories: 240, protein: 20, carbs: 26, fat: 4, servingSize: 1, servingUnit: "glass", category: "Beverages" }
  ],
  Dinner: [
    { name: "Baked Salmon with Sweet Potato & Asparagus", calories: 520, protein: 38, carbs: 36, fat: 22, servingSize: 1, servingUnit: "plate", category: "Seafood" },
    { name: "Grilled Tofu & Brown Rice Veggie Stir-Fry", calories: 460, protein: 20, carbs: 58, fat: 14, servingSize: 1, servingUnit: "plate", category: "Protein" },
    { name: "Lean Herb Grilled Steak with Steamed Broccoli", calories: 580, protein: 46, carbs: 18, fat: 26, servingSize: 1, servingUnit: "plate", category: "Meat" }
  ]
};

/**
 * Generate foods for a specific meal
 */
const getFoodsForMeal = async (
  mealType,
  targetCalories,
  foodPreference = "non-vegetarian"
) => {
  // Normalize food preference string (e.g. 'non-vegetarian' -> 'Non-Vegetarian')
  const prefRegex = new RegExp(`^${(foodPreference || "").replace(/-/g, "[- ]?")}$`, "i");

  // Fetch foods for this meal
  let foods = await Food.find({
    mealType: mealType,
    foodPreference: { $regex: prefRegex },
    isActive: true,
  }).select("-__v");

  // Fallback: If no preference-specific foods found, try without preference filter
  if (!foods.length) {
    foods = await Food.find({
      mealType: mealType,
      isActive: true,
    }).select("-__v");
  }

  // Fallback: If DB still has 0 foods, use default fallback foods
  if (!foods.length) {
    foods = defaultFallbackFoods[mealType] || [];
  }

  const selectedFoods = [];
  let totalCalories = 0;

  for (const food of foods) {
    if (totalCalories >= targetCalories && selectedFoods.length > 0) break;
    selectedFoods.push(food);
    totalCalories += food.calories || 300;
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
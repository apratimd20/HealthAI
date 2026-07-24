import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Fruits",
        "Vegetables",
        "Grains",
        "Protein",
        "Dairy",
        "Dairy Alternatives",
        "Nuts",
        "Condiments",
        "Oils & Fats",
        "Herbs & Spices",
        "Legumes",
        "Processed Foods",
        "Seeds",
        "Meat",
        "Seafood",
        "Beverages",
        "Snacks",
        "Others",
      ],
    },

    servingSize: {
      type: Number,
      required: true,
    },

    servingUnit: {
      type: String,
      default: "g",
    },

    calories: {
      type: Number,
      required: true,
    },

    protein: {
      type: Number,
      default: 0,
    },

    carbs: {
      type: Number,
      default: 0,
    },

    fat: {
      type: Number,
      default: 0,
    },

    fiber: {
      type: Number,
      default: 0,
    },

    sugar: {
      type: Number,
      default: 0,
    },

    sodium: {
      type: Number,
      default: 0,
    },

    foodPreference: {
      type: String,
      enum: [
        "Vegetarian",
        "Non-Vegetarian",
        "Vegan",
      ],
      required: true,
    },

    mealType: [
      {
        type: String,
        enum: [
          "Breakfast",
          "Lunch",
          "Dinner",
          "Snacks",
        ],
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Food", foodSchema);
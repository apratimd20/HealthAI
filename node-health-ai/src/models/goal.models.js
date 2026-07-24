import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ============ BASIC INFO ============
    age: {
      type: Number,
      required: true,
      min: 10,
      max: 120,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    height: {
      type: Number,
      required: true,
      min: 50,
      max: 300,
    },

    weight: {
      type: Number,
      required: true,
      min: 20,
      max: 500,
    },

    targetWeight: {
      type: Number,
      required: true,
      min: 20,
      max: 500,
    },

    goal: {
      type: String,
      enum: ["lose", "gain", "maintain"],
      required: true,
    },

    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
      required: true,
    },

    // ============ LIFESTYLE ============
    sleepHours: {
      type: Number,
      default: 8,
      min: 4,
      max: 12,
    },

    stressLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    smokingStatus: {
      type: String,
      enum: ["never", "former", "current"],
      default: "never",
    },

    alcoholConsumption: {
      type: String,
      enum: ["never", "rarely", "sometimes", "regularly"],
      default: "rarely",
    },

    dailySteps: {
      type: Number,
      default: 5000,
      min: 0,
      max: 50000,
    },

    // ============ DIETARY PREFERENCES ============
    foodPreference: {
      type: String,
      enum: ["non-vegetarian", "vegetarian", "vegan"],
      default: "non-vegetarian",
    },

    mealFrequency: {
      type: Number,
      default: 3,
      min: 1,
      max: 6,
    },

    waterIntake: {
      type: Number,
      default: 2.5,
      min: 1,
      max: 10,
    },

    caffeineIntake: {
      type: Number,
      default: 100,
      min: 0,
      max: 1000,
    },

    sugarIntake: {
      type: Number,
      default: 25,
      min: 0,
      max: 200,
    },

    // ============ HEALTH CONDITIONS ============
    medicalConditions: {
      type: [String],
      default: [],
    },

    allergies: {
      type: [String],
      default: [],
    },

    medications: {
      type: [String],
      default: [],
    },

    // ============ FITNESS ============
    exerciseDays: {
      type: Number,
      default: 3,
      min: 0,
      max: 7,
    },

    preferredWorkoutType: {
      type: String,
      enum: ["cardio", "strength", "yoga", "mixed"],
      default: "mixed",
    },

    // ============ CUSTOM GOALS ============
    targetCalories: {
      type: Number,
      default: 0,
    },

    targetProtein: {
      type: Number,
      default: 0,
    },

    targetCarbs: {
      type: Number,
      default: 0,
    },

    targetFat: {
      type: Number,
      default: 0,
    },

    targetFiber: {
      type: Number,
      default: 0,
    },

    // ============ ADDITIONAL ============
    dietaryRestrictions: {
      type: String,
      default: "",
    },

    cuisinePreference: {
      type: String,
      enum: ["all", "indian", "chinese", "italian", "mexican", "japanese", "mediterranean"],
      default: "all",
    },

    cookingTimePreference: {
      type: String,
      enum: ["quick", "medium", "elaborate"],
      default: "medium",
    },

    budgetPreference: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    // ============ STATUS ============
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    deactivatedAt: {
      type: Date,
      default: null,
    },

    // ============ METADATA ============
    bmiAtCreation: {
      type: Number,
      default: null,
    },

    bmrAtCreation: {
      type: Number,
      default: null,
    },

  },
  {
    timestamps: true,
  }
);

// ============ VIRTUAL FIELDS ============
// Calculate BMI
goalSchema.virtual('bmi').get(function() {
  if (!this.height || !this.weight) return null;
  const heightInMeters = this.height / 100;
  return parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
});

// Calculate BMR (Mifflin-St Jeor)
goalSchema.virtual('bmr').get(function() {
  if (!this.age || !this.gender || !this.height || !this.weight) return null;
  let bmr;
  if (this.gender === 'Male') {
    bmr = 10 * this.weight + 6.25 * this.height - 5 * this.age + 5;
  } else {
    bmr = 10 * this.weight + 6.25 * this.height - 5 * this.age - 161;
  }
  return Math.round(bmr);
});

// Calculate TDEE
goalSchema.virtual('tdee').get(function() {
  if (!this.bmr || !this.activityLevel) return null;
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return Math.round(this.bmr * (multipliers[this.activityLevel] || 1.55));
});

// Calculate target daily calories based on goal
goalSchema.virtual('targetDailyCalories').get(function() {
  if (!this.tdee || !this.goal) return null;
  let adjustment = 0;
  switch (this.goal) {
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
  return Math.max(this.tdee + adjustment, 1200);
});

// ============ INDEXES ============
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, createdAt: -1 });

// ============ TO JSON ============
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

export default mongoose.model("Goal", goalSchema);
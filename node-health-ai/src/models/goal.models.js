
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

    // ============ LIFESTYLE & SCHEDULE ============
    sleepHours: {
      type: Number,
      default: 8,
      min: 4,
      max: 12,
    },

    wakeTime: {
      type: String,
      default: "06:00",
    },

    sleepTime: {
      type: String,
      default: "22:00",
    },

    workStart: {
      type: String,
      default: "09:00",
    },

    workEnd: {
      type: String,
      default: "18:00",
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

    // ============ HEALTH CONDITIONS ============
    medicalConditions: {
      type: [String],
      default: [],
    },

    allergies: {
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

    // ============ PREFERENCES ============
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

// Virtual fields for BMI, BMR, TDEE
goalSchema.virtual('bmi').get(function() {
  if (!this.height || !this.weight) return null;
  const heightInMeters = this.height / 100;
  return parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
});

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

goalSchema.index({ user: 1, status: 1 });
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

export default mongoose.model("Goal", goalSchema);
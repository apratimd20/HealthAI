import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { healthService } from '../../services/healthService';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import {
  goals,
  activityLevels,
  genders,
  foodPreferences,
  stressLevels,
  smokingStatuses,
  alcoholOptions,
  workoutTypes,
  cuisinePreferences,
  cookingTimeOptions,
  budgetOptions,
} from '../../constants/formOptions';
import toast from 'react-hot-toast';
import {
  IoBodyOutline,
  IoOptionsOutline,
  IoRestaurantOutline,
  IoAlertCircleOutline,
  IoCloseOutline,
  IoHeartOutline,
  IoFitnessOutline,
  IoMoonOutline,
  IoWaterOutline,
  IoSunnyOutline,
  IoPulseOutline,
} from 'react-icons/io5';

export default function GoalModal({ isOpen, onClose, onSuccess }) {
  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm({
    defaultValues: {
      // Basic Info
      gender: 'Male',
      goal: 'lose',
      activityLevel: 'moderate',
      
      // Lifestyle
      sleepHours: 8,
      stressLevel: 'medium',
      smokingStatus: 'never',
      alcoholConsumption: 'rarely',
      dailySteps: 5000,
      
      // Dietary
      foodPreference: 'non-vegetarian',
      mealFrequency: 3,
      waterIntake: 2.5,
      caffeineIntake: 100,
      sugarIntake: 25,
      
      // Health
      medicalConditions: '',
      allergies: '',
      medications: '',
      
      // Fitness
      exerciseDays: 3,
      preferredWorkoutType: 'mixed',
      
      // Custom Goals
      targetCalories: '',
      targetProtein: '',
      targetCarbs: '',
      targetFat: '',
      targetFiber: '',
      
      // Preferences
      dietaryRestrictions: '',
      cuisinePreference: 'all',
      cookingTimePreference: 'medium',
      budgetPreference: 'medium',
    },
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const watchedFields = watch();
  const totalSteps = 6;

  if (!isOpen) return null;

  const handleNext = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['age', 'gender', 'height', 'weight'];
    } else if (step === 2) {
      fieldsToValidate = ['goal', 'targetWeight', 'activityLevel'];
    } else if (step === 3) {
      fieldsToValidate = ['foodPreference', 'sleepHours', 'waterIntake'];
    } else if (step === 4) {
      fieldsToValidate = ['stressLevel', 'exerciseDays'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Parse array fields
      const parseArrayField = (value) => {
        if (!value) return [];
        return value.split(',').map((item) => item.trim()).filter(Boolean);
      };

      const payload = {
        // Basic Info
        age: Number(data.age),
        gender: data.gender,
        height: Number(data.height),
        weight: Number(data.weight),
        targetWeight: Number(data.targetWeight),
        goal: data.goal,
        activityLevel: data.activityLevel,
        
        // Lifestyle
        sleepHours: Number(data.sleepHours),
        stressLevel: data.stressLevel,
        smokingStatus: data.smokingStatus,
        alcoholConsumption: data.alcoholConsumption,
        dailySteps: Number(data.dailySteps) || 5000,
        
        // Dietary
        foodPreference: data.foodPreference,
        mealFrequency: Number(data.mealFrequency) || 3,
        waterIntake: Number(data.waterIntake) || 2.5,
        caffeineIntake: Number(data.caffeineIntake) || 100,
        sugarIntake: Number(data.sugarIntake) || 25,
        
        // Health
        medicalConditions: parseArrayField(data.medicalConditions),
        allergies: parseArrayField(data.allergies),
        medications: parseArrayField(data.medications),
        
        // Fitness
        exerciseDays: Number(data.exerciseDays) || 3,
        preferredWorkoutType: data.preferredWorkoutType,
        
        // Custom Goals
        targetCalories: Number(data.targetCalories) || 0,
        targetProtein: Number(data.targetProtein) || 0,
        targetCarbs: Number(data.targetCarbs) || 0,
        targetFat: Number(data.targetFat) || 0,
        targetFiber: Number(data.targetFiber) || 0,
        
        // Preferences
        dietaryRestrictions: data.dietaryRestrictions || '',
        cuisinePreference: data.cuisinePreference || 'all',
        cookingTimePreference: data.cookingTimePreference || 'medium',
        budgetPreference: data.budgetPreference || 'medium',
      };

      const response = await healthService.setGoal(payload);
      if (response.success) {
        toast.success('🎯 Your personalized health goal has been set up successfully!');
        setStep(1);
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to save health profile');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error saving goal profile';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
  };

  const SelectField = ({ label, name, options, errorMsg, rules, className = '', placeholder = 'Select an option' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-sm font-medium text-fg-muted">{label}</label>
      <select className="form-select" {...register(name, rules)}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      {errorMsg && <span className="text-xs text-danger">{errorMsg}</span>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      <motion.div
        className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
      >
        <Card className="glass-panel relative" glow>
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md p-1 text-fg-muted hover:bg-surface-muted hover:text-fg"
            onClick={onClose}
            aria-label="Close modal"
          >
            <IoCloseOutline size={24} />
          </button>

          <div className="mb-6 pr-10">
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-border-default">
              <div
                className="h-full rounded-full bg-brand transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
            <div className="flex justify-between px-1">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <span
                  key={n}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    step >= n ? 'bg-brand text-white' : 'bg-surface-muted text-fg-subtle'
                  }`}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoBodyOutline className="mx-auto mb-2 text-3xl text-brand sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Tell us about yourself</h2>
                    <p className="mt-1 text-sm text-fg-muted">
                      Enter your biometrics to calculate BMI and calorie benchmarks.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Age"
                      type="number"
                      placeholder="e.g. 25"
                      error={errors.age?.message}
                      {...register('age', {
                        required: 'Age is required',
                        min: { value: 10, message: 'Minimum age is 10' },
                        max: { value: 120, message: 'Maximum age is 120' },
                      })}
                    />
                    <SelectField
                      label="Gender"
                      name="gender"
                      options={genders}
                      errorMsg={errors.gender?.message}
                      rules={{ required: 'Gender is required' }}
                    />
                    <Input
                      label="Height (cm)"
                      type="number"
                      placeholder="e.g. 175"
                      error={errors.height?.message}
                      {...register('height', {
                        required: 'Height is required',
                        min: { value: 50, message: 'Minimum height is 50 cm' },
                        max: { value: 300, message: 'Maximum height is 300 cm' },
                      })}
                    />
                    <Input
                      label="Weight (kg)"
                      type="number"
                      placeholder="e.g. 70"
                      error={errors.weight?.message}
                      {...register('weight', {
                        required: 'Weight is required',
                        min: { value: 20, message: 'Minimum weight is 20 kg' },
                        max: { value: 500, message: 'Maximum weight is 500 kg' },
                      })}
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoOptionsOutline className="mx-auto mb-2 text-3xl text-water sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Set your objectives</h2>
                    <p className="mt-1 text-sm text-fg-muted">Weight targets and activity level.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Primary Goal"
                      name="goal"
                      options={goals}
                      errorMsg={errors.goal?.message}
                      rules={{ required: 'Goal is required' }}
                    />
                    <Input
                      label="Target Weight (kg)"
                      type="number"
                      placeholder="e.g. 65"
                      error={errors.targetWeight?.message}
                      {...register('targetWeight', {
                        required: 'Target weight is required',
                        min: { value: 20, message: 'Minimum target is 20 kg' },
                        max: { value: 500, message: 'Maximum target is 500 kg' },
                      })}
                    />
                    <SelectField
                      label="Activity Level"
                      name="activityLevel"
                      options={activityLevels}
                      errorMsg={errors.activityLevel?.message}
                      rules={{ required: 'Activity level is required' }}
                      className="sm:col-span-2"
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoRestaurantOutline className="mx-auto mb-2 text-3xl text-calories sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Dietary & Lifestyle</h2>
                    <p className="mt-1 text-sm text-fg-muted">Your eating habits and daily routine.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Dietary Preference"
                      name="foodPreference"
                      options={foodPreferences}
                    />
                    <SelectField
                      label="Cuisine Preference"
                      name="cuisinePreference"
                      options={cuisinePreferences}
                    />
                    <Input
                      label="Sleep (Hours)"
                      type="number"
                      placeholder="e.g. 8"
                      error={errors.sleepHours?.message}
                      {...register('sleepHours', {
                        required: 'Sleep duration is required',
                        min: { value: 4, message: 'Minimum is 4 hours' },
                        max: { value: 12, message: 'Maximum is 12 hours' },
                      })}
                    />
                    <Input
                      label="Daily Water Target (Liters)"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 2.5"
                      {...register('waterIntake', {
                        min: { value: 1, message: 'Minimum is 1 liter' },
                        max: { value: 10, message: 'Maximum is 10 liters' },
                      })}
                    />
                    <Input
                      label="Daily Steps"
                      type="number"
                      placeholder="e.g. 5000"
                      {...register('dailySteps', {
                        min: { value: 0, message: 'Cannot be negative' },
                        max: { value: 50000, message: 'Maximum is 50,000' },
                      })}
                    />
                    <SelectField
                      label="Cooking Time Preference"
                      name="cookingTimePreference"
                      options={cookingTimeOptions}
                    />
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoHeartOutline className="mx-auto mb-2 text-3xl text-danger sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Health & Fitness</h2>
                    <p className="mt-1 text-sm text-fg-muted">Your health status and fitness routine.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Stress Level"
                      name="stressLevel"
                      options={stressLevels}
                    />
                    <SelectField
                      label="Smoking Status"
                      name="smokingStatus"
                      options={smokingStatuses}
                    />
                    <SelectField
                      label="Alcohol Consumption"
                      name="alcoholConsumption"
                      options={alcoholOptions}
                    />
                    <SelectField
                      label="Preferred Workout Type"
                      name="preferredWorkoutType"
                      options={workoutTypes}
                    />
                    <Input
                      label="Exercise Days Per Week"
                      type="number"
                      placeholder="e.g. 3"
                      {...register('exerciseDays', {
                        min: { value: 0, message: 'Minimum is 0' },
                        max: { value: 7, message: 'Maximum is 7' },
                      })}
                    />
                    <SelectField
                      label="Budget Preference"
                      name="budgetPreference"
                      options={budgetOptions}
                    />
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="step5" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoAlertCircleOutline className="mx-auto mb-2 text-3xl text-brand sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Medical Profile</h2>
                    <p className="mt-1 text-sm text-fg-muted">
                      Comma-separated lists for conditions, allergies, and medications.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <Input
                      label="Medical Conditions"
                      placeholder="e.g. Diabetes, Hypertension"
                      {...register('medicalConditions')}
                    />
                    <Input
                      label="Allergies"
                      placeholder="e.g. Peanuts, Shellfish"
                      {...register('allergies')}
                    />
                    <Input
                      label="Medications"
                      placeholder="e.g. Metformin, Lisinopril"
                      {...register('medications')}
                    />
                    <Input
                      label="Dietary Restrictions"
                      placeholder="e.g. Low sodium, No gluten"
                      {...register('dietaryRestrictions')}
                    />
                  </div>
                </motion.div>
              )}

              {step === 6 && (
                <motion.div key="step6" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoFitnessOutline className="mx-auto mb-2 text-3xl text-water sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Custom Nutrition Goals</h2>
                    <p className="mt-1 text-sm text-fg-muted">
                      Set your personal macro targets (optional).
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Target Calories"
                      type="number"
                      placeholder="e.g. 2000"
                      {...register('targetCalories')}
                    />
                    <Input
                      label="Target Protein (g)"
                      type="number"
                      placeholder="e.g. 150"
                      {...register('targetProtein')}
                    />
                    <Input
                      label="Target Carbs (g)"
                      type="number"
                      placeholder="e.g. 200"
                      {...register('targetCarbs')}
                    />
                    <Input
                      label="Target Fat (g)"
                      type="number"
                      placeholder="e.g. 65"
                      {...register('targetFat')}
                    />
                    <Input
                      label="Target Fiber (g)"
                      type="number"
                      placeholder="e.g. 30"
                      {...register('targetFiber')}
                    />
                  </div>
                  
                  {/* Summary Card */}
                  <div className="rounded-lg bg-surface-muted p-4 text-left">
                    <h3 className="mb-3 font-semibold text-fg">📋 Your Health Profile Summary</h3>
                    <div className="grid gap-2 text-sm text-fg-muted sm:grid-cols-3">
                      <div>
                        <p><span className="text-fg-subtle">Age:</span> {watchedFields.age || '-'}</p>
                        <p><span className="text-fg-subtle">Gender:</span> {watchedFields.gender || '-'}</p>
                        <p><span className="text-fg-subtle">Height:</span> {watchedFields.height || '-'} cm</p>
                        <p><span className="text-fg-subtle">Weight:</span> {watchedFields.weight || '-'} kg</p>
                      </div>
                      <div>
                        <p><span className="text-fg-subtle">Goal:</span> {watchedFields.goal || '-'}</p>
                        <p><span className="text-fg-subtle">Target:</span> {watchedFields.targetWeight || '-'} kg</p>
                        <p><span className="text-fg-subtle">Activity:</span> {watchedFields.activityLevel || '-'}</p>
                        <p><span className="text-fg-subtle">Sleep:</span> {watchedFields.sleepHours || '-'}h</p>
                      </div>
                      <div>
                        <p><span className="text-fg-subtle">Diet:</span> {watchedFields.foodPreference || '-'}</p>
                        <p><span className="text-fg-subtle">Exercise:</span> {watchedFields.exerciseDays || '-'} days</p>
                        <p><span className="text-fg-subtle">Water:</span> {watchedFields.waterIntake || '-'}L</p>
                        <p><span className="text-fg-subtle">Cuisine:</span> {watchedFields.cuisinePreference || '-'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-border-default pt-4">
              {step > 1 ? (
                <Button variant="secondary" type="button" onClick={handleBack} disabled={loading}>
                  Back
                </Button>
              ) : (
                <div />
              )}
              {step < totalSteps ? (
                <Button type="button" onClick={handleNext}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" loading={loading}>
                  🎯 Generate Plan
                </Button>
              )}
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
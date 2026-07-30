// src/components/ui/GoalModal.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { healthService } from '../../services/healthService';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import { goals, activityLevels, genders } from '../../constants/formOptions';
import toast from 'react-hot-toast';
import {
  IoBodyOutline,
  IoOptionsOutline,
  IoCloseOutline,
  IoBulbOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5';

export default function GoalModal({ isOpen, onClose, onSuccess }) {
  const { register, handleSubmit, watch, trigger, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      gender: 'Male',
      goal: '',
      activityLevel: 'moderate',
    }
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState(null);
  const [smartSuggestion, setSmartSuggestion] = useState(null);
  const watchedFields = watch();
  const totalSteps = 2;

  // Reset form and step whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setLoading(false);
      setBmi(null);
      setBmiCategory(null);
      setSmartSuggestion(null);
      reset({
        gender: 'Male',
        goal: '',
        activityLevel: 'moderate',
        age: '',
        height: '',
        weight: '',
      });
    }
  }, [isOpen, reset]);

  // Calculate BMI and provide smart suggestions
  useEffect(() => {
    const height = watchedFields.height;
    const weight = watchedFields.weight;
    if (height && weight && height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      setBmi(calculatedBmi.toFixed(1));
      
      let category = '';
      let suggestion = '';
      
      if (calculatedBmi < 18.5) {
        category = 'Underweight';
        suggestion = 'Based on your BMI, we recommend focusing on healthy weight gain.';
      } else if (calculatedBmi < 25) {
        category = 'Normal';
        suggestion = 'Great! Your BMI is in the healthy range. Choose maintain or set a specific goal.';
      } else if (calculatedBmi < 30) {
        category = 'Overweight';
        suggestion = 'Based on your BMI, we recommend focusing on healthy weight loss.';
      } else {
        category = 'Obese';
        suggestion = 'For your health, we strongly recommend weight loss. Consider consulting a doctor.';
      }
      
      setBmiCategory(category);
      setSmartSuggestion(suggestion);
      
      // Auto-suggest goal based on BMI
      if (calculatedBmi < 18.5) {
        setValue('goal', 'gain');
      } else if (calculatedBmi >= 25) {
        setValue('goal', 'lose');
      } else {
        setValue('goal', 'maintain');
      }
    }
  }, [watchedFields.height, watchedFields.weight, setValue]);

  if (!isOpen) return null;

  const handleNext = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['age', 'gender', 'height', 'weight'];
    } else if (step === 2) {
      fieldsToValidate = ['goal', 'activityLevel'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setStep((prev) => prev - 1);

  // ✅ Fixed: This is the actual form submission
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        age: Number(data.age),
        gender: data.gender,
        height: Number(data.height),
        weight: Number(data.weight),
        targetWeight: data.goal === 'maintain' ? Number(data.weight) : Number(data.weight) + (data.goal === 'gain' ? 5 : -5),
        goal: data.goal,
        activityLevel: data.activityLevel,
        sleepHours: 8,
        wakeTime: '06:00',
        sleepTime: '22:00',
        workStart: '09:00',
        workEnd: '18:00',
        foodPreference: 'non-vegetarian',
        mealFrequency: 3,
        waterIntake: 2.5,
        medicalConditions: [],
        allergies: [],
        exerciseDays: 3,
        preferredWorkoutType: 'mixed',
        cuisinePreference: 'all',
        cookingTimePreference: 'medium',
      };

      const response = await healthService.setGoal(payload);
      if (response.success) {
        toast.success('Health goal set successfully!');
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

  const getGoalColor = (goal) => {
    if (goal === 'lose') return 'text-calories';
    if (goal === 'gain') return 'text-brand';
    return 'text-water';
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
      >
        <Card className="glass-panel relative" glow>
          <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-md p-1 text-fg-muted hover:bg-surface-muted hover:text-fg">
            <IoCloseOutline size={24} />
          </button>

          <div className="mb-6 pr-10">
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-border-default">
              <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>
            <div className="flex justify-between px-1">
              {[1, 2].map((n) => (
                <span key={n} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= n ? 'bg-brand text-white' : 'bg-surface-muted text-fg-subtle'}`}>
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* ✅ FIXED: Form handling */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoBodyOutline className="mx-auto mb-2 text-3xl text-brand sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Your Basic Info</h2>
                    <p className="mt-1 text-sm text-fg-muted">We need these details to calculate your BMI and create a personalized plan.</p>
                  </div>
                  
                  {bmi && (
                    <div className={`rounded-lg p-4 text-left ${
                      bmiCategory === 'Normal' ? 'bg-green-500/10 border border-green-500/20' : 
                      bmiCategory === 'Underweight' ? 'bg-yellow-500/10 border border-yellow-500/20' : 
                      'bg-orange-500/10 border border-orange-500/20'
                    }`}>
                      <div className="flex items-start gap-3">
                        {bmiCategory === 'Normal' ? (
                          <IoCheckmarkCircleOutline className="text-green-400 text-xl mt-0.5" />
                        ) : (
                          <IoWarningOutline className={`text-xl mt-0.5 ${
                            bmiCategory === 'Underweight' ? 'text-yellow-400' : 'text-orange-400'
                          }`} />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            BMI: <span className="font-bold">{bmi}</span> ({bmiCategory})
                          </p>
                          <p className="text-xs text-fg-muted mt-1">{smartSuggestion}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input 
                      label="Age" 
                      type="number" 
                      placeholder="e.g. 25" 
                      error={errors.age?.message} 
                      {...register('age', { 
                        required: 'Age is required', 
                        min: { value: 10, message: 'Minimum age is 10' }, 
                        max: { value: 120, message: 'Maximum age is 120' } 
                      })} 
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-fg-muted">Gender</label>
                      <select 
                        className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg focus:border-brand focus:outline-none"
                        {...register('gender', { required: 'Gender is required' })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && <span className="text-xs text-danger">{errors.gender.message}</span>}
                    </div>
                    <Input 
                      label="Height (cm)" 
                      type="number" 
                      placeholder="e.g. 175" 
                      error={errors.height?.message} 
                      {...register('height', { 
                        required: 'Height is required', 
                        min: { value: 50, message: 'Minimum height is 50 cm' }, 
                        max: { value: 300, message: 'Maximum height is 300 cm' } 
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
                        max: { value: 500, message: 'Maximum weight is 500 kg' } 
                      })} 
                    />
                  </div>

                  {/* ✅ FIXED: Continue button in step 1 */}
                  <div className="mt-6 flex items-center justify-end">
                    <Button type="button" onClick={handleNext}>
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoOptionsOutline className="mx-auto mb-2 text-3xl text-water sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Your Goal & Lifestyle</h2>
                    <p className="mt-1 text-sm text-fg-muted">Based on your BMI, we've suggested a goal. You can change it if needed.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-fg-muted">What's your goal?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {goals.map((g) => (
                          <button
                            key={g.value}
                            type="button"
                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                              watchedFields.goal === g.value
                                ? `border-brand bg-brand/10 ${getGoalColor(g.value)}`
                                : 'border-border-default bg-surface-muted text-fg-muted hover:border-brand/50'
                            }`}
                            onClick={() => setValue('goal', g.value)}
                          >
                            <div className="text-lg">{g.label.split(' ')[0]}</div>
                            <div className="text-xs">{g.label.split(' ').slice(1).join(' ')}</div>
                          </button>
                        ))}
                      </div>
                      {errors.goal && <span className="text-xs text-danger">{errors.goal.message}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-fg-muted">Activity Level</label>
                      <select 
                        className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg focus:border-brand focus:outline-none"
                        {...register('activityLevel', { required: 'Activity level is required' })}
                      >
                        {activityLevels.map((level) => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                      {errors.activityLevel && <span className="text-xs text-danger">{errors.activityLevel.message}</span>}
                    </div>

                    {watchedFields.goal && (
                      <div className="rounded-lg bg-surface-muted p-4">
                        <div className="flex items-start gap-3">
                          <IoBulbOutline className="text-brand text-xl mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-fg">Your Plan Summary</p>
                            <p className="text-xs text-fg-muted mt-1">
                              {watchedFields.goal === 'lose' && 'You will aim to lose weight with a calorie deficit.'}
                              {watchedFields.goal === 'gain' && 'You will aim to gain weight with a calorie surplus.'}
                              {watchedFields.goal === 'maintain' && 'You will maintain your current weight with balanced calories.'}
                              {' '}We'll create a personalized daily plan with meals and workouts.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ✅ FIXED: Navigation buttons in step 2 */}
                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-border-default pt-4">
                    <Button variant="secondary" type="button" onClick={handleBack} disabled={loading}>
                      Back
                    </Button>
                    <Button type="submit" loading={loading}>
                      Generate Plan
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
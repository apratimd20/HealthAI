// components/ui/GoalModal.jsx
import React, { useState, useEffect } from 'react';
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
  workoutTypes,
  cuisinePreferences,
  cookingTimeOptions,
  mealFrequencyOptions,
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
  IoTimeOutline,
  IoCalendarOutline,
  IoBulbOutline,
} from 'react-icons/io5';

export default function GoalModal({ isOpen, onClose, onSuccess }) {
  const { register, handleSubmit, watch, trigger, setValue, formState: { errors } } = useForm({
    defaultValues: {
      gender: 'Male',
      goal: 'lose',
      activityLevel: 'moderate',
      sleepHours: 8,
      wakeTime: '06:00',
      sleepTime: '22:00',
      workStart: '09:00',
      workEnd: '18:00',
      foodPreference: 'non-vegetarian',
      mealFrequency: 3,
      waterIntake: 2.5,
      medicalConditions: '',
      allergies: '',
      exerciseDays: 3,
      preferredWorkoutType: 'mixed',
      cuisinePreference: 'all',
      cookingTimePreference: 'medium',
    },
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState(null);
  const watchedFields = watch();
  const totalSteps = 4;

  // Calculate BMI on the fly
  useEffect(() => {
    const height = watchedFields.height;
    const weight = watchedFields.weight;
    if (height && weight && height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      setBmi(calculatedBmi.toFixed(1));
      
      if (calculatedBmi < 18.5) setBmiCategory('Underweight');
      else if (calculatedBmi < 25) setBmiCategory('Normal');
      else if (calculatedBmi < 30) setBmiCategory('Overweight');
      else setBmiCategory('Obese');
    }
  }, [watchedFields.height, watchedFields.weight]);

  if (!isOpen) return null;

  const handleNext = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['age', 'gender', 'height', 'weight'];
    } else if (step === 2) {
      fieldsToValidate = ['goal', 'targetWeight', 'activityLevel'];
    } else if (step === 3) {
      fieldsToValidate = ['foodPreference', 'sleepHours'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        age: Number(data.age),
        gender: data.gender,
        height: Number(data.height),
        weight: Number(data.weight),
        targetWeight: Number(data.targetWeight),
        goal: data.goal,
        activityLevel: data.activityLevel,
        sleepHours: Number(data.sleepHours),
        wakeTime: data.wakeTime,
        sleepTime: data.sleepTime,
        workStart: data.workStart,
        workEnd: data.workEnd,
        foodPreference: data.foodPreference,
        mealFrequency: Number(data.mealFrequency),
        waterIntake: Number(data.waterIntake),
        medicalConditions: data.medicalConditions ? data.medicalConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
        allergies: data.allergies ? data.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        exerciseDays: Number(data.exerciseDays),
        preferredWorkoutType: data.preferredWorkoutType,
        cuisinePreference: data.cuisinePreference,
        cookingTimePreference: data.cookingTimePreference,
      };

      const response = await healthService.setGoal(payload);
      if (response.success) {
        toast.success('🎯 Your personalized health goal has been set up successfully!');
        setStep(1);
        onSuccess();
        onClose();
      } else {
        // Handle smart suggestions
        if (response.data?.suggestion) {
          const suggestion = response.data.suggestion;
          if (suggestion === 'gain') {
            toast.error('💡 Did you mean to select "Gain Weight"?');
            setValue('goal', 'gain');
          } else if (suggestion === 'lose') {
            toast.error('💡 Did you mean to select "Lose Weight"?');
            setValue('goal', 'lose');
          } else {
            toast.error(response.message || 'Failed to save health profile');
          }
        } else {
          toast.error(response.message || 'Failed to save health profile');
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error saving goal profile';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const SelectField = ({ label, name, options, errorMsg, rules, className = '', placeholder = 'Select an option' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-sm font-medium text-fg-muted">{label}</label>
      <select className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg focus:border-brand focus:outline-none" {...register(name, rules)}>
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
          <button onClick={onClose} className="absolute right-4 top-4 rounded-md p-1 text-fg-muted hover:bg-surface-muted hover:text-fg">
            <IoCloseOutline size={24} />
          </button>

          <div className="mb-6 pr-10">
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-border-default">
              <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>
            <div className="flex justify-between px-1">
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= n ? 'bg-brand text-white' : 'bg-surface-muted text-fg-subtle'}`}>
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
                    <p className="mt-1 text-sm text-fg-muted">We'll use this to calculate your BMI and create a personalized plan.</p>
                  </div>
                  
                  {bmi && (
                    <div className={`rounded-lg p-3 text-center ${bmiCategory === 'Normal' ? 'bg-green-500/10 text-green-400' : bmiCategory === 'Underweight' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-orange-500/10 text-orange-400'}`}>
                      <p className="text-sm font-medium">Your BMI: <span className="font-bold">{bmi}</span> ({bmiCategory})</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Age" type="number" placeholder="e.g. 25" error={errors.age?.message} {...register('age', { required: 'Age is required', min: { value: 10, message: 'Minimum age is 10' }, max: { value: 120, message: 'Maximum age is 120' } })} />
                    <SelectField label="Gender" name="gender" options={genders} errorMsg={errors.gender?.message} rules={{ required: 'Gender is required' }} />
                    <Input label="Height (cm)" type="number" placeholder="e.g. 175" error={errors.height?.message} {...register('height', { required: 'Height is required', min: { value: 50, message: 'Minimum height is 50 cm' }, max: { value: 300, message: 'Maximum height is 300 cm' } })} />
                    <Input label="Weight (kg)" type="number" placeholder="e.g. 70" error={errors.weight?.message} {...register('weight', { required: 'Weight is required', min: { value: 20, message: 'Minimum weight is 20 kg' }, max: { value: 500, message: 'Maximum weight is 500 kg' } })} />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoOptionsOutline className="mx-auto mb-2 text-3xl text-water sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Set your objectives</h2>
                    <p className="mt-1 text-sm text-fg-muted">Tell us what you want to achieve and how active you are.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField label="Primary Goal" name="goal" options={goals} errorMsg={errors.goal?.message} rules={{ required: 'Goal is required' }} />
                    <Input label="Target Weight (kg)" type="number" placeholder="e.g. 65" error={errors.targetWeight?.message} {...register('targetWeight', { required: 'Target weight is required', min: { value: 20, message: 'Minimum target is 20 kg' }, max: { value: 500, message: 'Maximum target is 500 kg' } })} />
                    <SelectField label="Activity Level" name="activityLevel" options={activityLevels} errorMsg={errors.activityLevel?.message} rules={{ required: 'Activity level is required' }} className="sm:col-span-2" />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoCalendarOutline className="mx-auto mb-2 text-3xl text-calories sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Your Daily Schedule</h2>
                    <p className="mt-1 text-sm text-fg-muted">Tell us about your daily routine so we can plan accordingly.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Sleep Hours" type="number" placeholder="e.g. 8" error={errors.sleepHours?.message} {...register('sleepHours', { required: 'Sleep duration is required', min: { value: 4, message: 'Minimum is 4 hours' }, max: { value: 12, message: 'Maximum is 12 hours' } })} />
                    <Input label="Wake Up Time" type="time" {...register('wakeTime')} />
                    <Input label="Sleep Time" type="time" {...register('sleepTime')} />
                    <Input label="Work Start" type="time" {...register('workStart')} />
                    <Input label="Work End" type="time" {...register('workEnd')} />
                    <SelectField label="Meal Frequency" name="mealFrequency" options={mealFrequencyOptions} />
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoFitnessOutline className="mx-auto mb-2 text-3xl text-water sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Preferences & Health</h2>
                    <p className="mt-1 text-sm text-fg-muted">Tell us about your dietary preferences and health conditions.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField label="Dietary Preference" name="foodPreference" options={foodPreferences} />
                    <SelectField label="Cuisine Preference" name="cuisinePreference" options={cuisinePreferences} />
                    <Input label="Water Intake (Liters)" type="number" step="0.1" placeholder="e.g. 2.5" {...register('waterIntake', { min: { value: 1, message: 'Minimum is 1 liter' }, max: { value: 10, message: 'Maximum is 10 liters' } })} />
                    <SelectField label="Cooking Time" name="cookingTimePreference" options={cookingTimeOptions} />
                    <SelectField label="Workout Type" name="preferredWorkoutType" options={workoutTypes} />
                    <Input label="Exercise Days/Week" type="number" placeholder="e.g. 3" {...register('exerciseDays', { min: { value: 0, message: 'Minimum is 0' }, max: { value: 7, message: 'Maximum is 7' } })} />
                  </div>
                  <div className="space-y-4">
                    <Input label="Medical Conditions (comma separated)" placeholder="e.g. Diabetes, Hypertension" {...register('medicalConditions')} />
                    <Input label="Allergies (comma separated)" placeholder="e.g. Peanuts, Shellfish" {...register('allergies')} />
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
                    {bmi && (
                      <div className="mt-3 border-t border-border-default pt-3">
                        <p className="text-sm"><span className="text-fg-subtle">BMI:</span> <span className="font-semibold">{bmi}</span> ({bmiCategory})</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-border-default pt-4">
              {step > 1 ? (
                <Button variant="secondary" type="button" onClick={handleBack} disabled={loading}>Back</Button>
              ) : <div />}
              {step < totalSteps ? (
                <Button type="button" onClick={handleNext}>Continue</Button>
              ) : (
                <Button type="submit" loading={loading}>🎯 Generate Plan</Button>
              )}
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
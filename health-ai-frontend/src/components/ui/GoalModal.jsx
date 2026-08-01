
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { healthService } from '../../services/healthService';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import { goals, activityLevels, genders, foodPreferences, workoutTypes, cuisinePreferences, cookingTimeOptions, mealFrequencyOptions } from '../../constants/formOptions';
import toast from 'react-hot-toast';
import {
  IoBodyOutline,
  IoOptionsOutline,
  IoCloseOutline,
  IoBulbOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoRestaurantOutline,
  IoSparklesOutline,
} from 'react-icons/io5';

export default function GoalModal({ isOpen, onClose, onSuccess }) {
  const { register, handleSubmit, watch, trigger, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      gender: 'Male',
      goal: '',
      activityLevel: 'moderate',
      foodPreference: 'non-vegetarian',
      mealFrequency: 3,
      cuisinePreference: 'all',
      cookingTimePreference: 'medium',
      preferredWorkoutType: 'mixed',
      exerciseDays: 3,
      wakeTime: '06:00',
      sleepTime: '22:00',
      workStart: '09:00',
      workEnd: '18:00',
      sleepHours: 8,
      medicalConditions: '',
      allergies: '',
    }
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState(null);
  const [smartSuggestion, setSmartSuggestion] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [fetchingAI, setFetchingAI] = useState(false);
  const [targetWeight, setTargetWeight] = useState('');
  const watchedFields = watch();
  const totalSteps = 3;

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setLoading(false);
      setBmi(null);
      setBmiCategory(null);
      setSmartSuggestion(null);
      setAiSuggestions(null);
      setTargetWeight('');
      reset({
        gender: 'Male', goal: '', activityLevel: 'moderate', foodPreference: 'non-vegetarian',
        mealFrequency: 3, cuisinePreference: 'all', cookingTimePreference: 'medium',
        preferredWorkoutType: 'mixed', exerciseDays: 3, wakeTime: '06:00', sleepTime: '22:00',
        workStart: '09:00', workEnd: '18:00', sleepHours: 8, medicalConditions: '', allergies: '',
        age: '', height: '', weight: '',
      });
    }
  }, [isOpen, reset]);

  const { height, weight, age, gender } = watchedFields;
  useEffect(() => {
    if (height && weight && height > 0 && weight > 0) {
      const h = Number(height) / 100;
      const w = Number(weight);
      const calculatedBmi = w / (h * h);
      setBmi(calculatedBmi.toFixed(1));

      let category = 'Normal', suggestion = 'Your BMI is healthy.';
      if (calculatedBmi < 18.5) { category = 'Underweight'; suggestion = 'Focus on healthy weight gain.'; }
      else if (calculatedBmi < 25) { category = 'Normal'; suggestion = 'Your BMI is in the healthy range.'; }
      else if (calculatedBmi < 30) { category = 'Overweight'; suggestion = 'Focus on healthy weight loss.'; }
      else { category = 'Obese'; suggestion = 'Weight loss recommended. Consult a doctor.'; }
      setBmiCategory(category);
      setSmartSuggestion(suggestion);

      let goal = 'maintain', tw = w;
      if (calculatedBmi < 18.5) { goal = 'gain'; tw = +(w * 1.08).toFixed(1); }
      else if (calculatedBmi >= 25) { goal = 'lose'; tw = +(w * 0.92).toFixed(1); }
      setValue('goal', goal);
      setTargetWeight(tw);

      if (age && gender && !fetchingAI && !aiSuggestions) {
        setFetchingAI(true);
        healthService.getSuggestions(Number(age), gender, Number(height), Number(weight))
          .then(res => {
            if (res.success && res.data) {
              setAiSuggestions(res.data);
              if (res.data.suggestedGoal) setValue('goal', res.data.suggestedGoal);
              if (res.data.suggestedTargetWeight) setTargetWeight(res.data.suggestedTargetWeight);
            }
          })
          .catch(() => {})
          .finally(() => setFetchingAI(false));
      }
    }
  }, [height, weight, age, gender]);

  if (!isOpen) return null;

  const handleNext = async () => {
    const fields = step === 1 ? ['age', 'gender', 'height', 'weight']
      : step === 2 ? ['goal', 'activityLevel'] : [];
    const valid = await trigger(fields);
    if (valid) setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const w = Number(data.weight);
      const tw = targetWeight ? Number(targetWeight) : (data.goal === 'maintain' ? w : w + (data.goal === 'gain' ? 5 : -5));
      const payload = {
        age: Number(data.age), gender: data.gender,
        height: Number(data.height), weight: w,
        targetWeight: tw, goal: data.goal, activityLevel: data.activityLevel,
        foodPreference: data.foodPreference, mealFrequency: Number(data.mealFrequency),
        cuisinePreference: data.cuisinePreference, cookingTimePreference: data.cookingTimePreference,
        wakeTime: data.wakeTime, sleepTime: data.sleepTime, sleepHours: Number(data.sleepHours),
        workStart: data.workStart, workEnd: data.workEnd,
        exerciseDays: Number(data.exerciseDays), preferredWorkoutType: data.preferredWorkoutType,
        medicalConditions: data.medicalConditions ? data.medicalConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
        allergies: data.allergies ? data.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        waterIntake: 2.5,
      };
      const response = await healthService.setGoal(payload);
      if (response.success) {
        toast.success('Health goal created!');
        setStep(1);
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to save goal');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving goal');
    } finally {
      setLoading(false);
    }
  };

  const bmiColor = bmiCategory === 'Normal' ? 'border-green-500/20 bg-green-500/10 text-green-400'
    : bmiCategory === 'Underweight' ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
    : 'border-orange-500/20 bg-orange-500/10 text-orange-400';

  const bmiIcon = bmiCategory === 'Normal' ? IoCheckmarkCircleOutline : IoWarningOutline;

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
              {['Basic Info', 'Goal', 'Lifestyle'].map((label, i) => (
                <span key={i} className={`flex items-center gap-1 text-xs font-medium ${step > i ? 'text-brand' : 'text-fg-subtle'}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${step >= i + 1 ? 'bg-brand text-white' : 'bg-surface-muted text-fg-subtle'}`}>{i + 1}</span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoBodyOutline className="mx-auto mb-2 text-3xl text-brand sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Your Basic Info</h2>
                    <p className="mt-1 text-sm text-fg-muted">We calculate your BMI and suggest a personalized plan.</p>
                  </div>

                  {bmi && (
                    <div className={`rounded-lg border p-4 ${bmiColor}`}>
                      <div className="flex items-start gap-3">
                        {React.createElement(bmiIcon, { className: 'text-xl mt-0.5 shrink-0' })}
                        <div>
                          <p className="text-sm font-medium text-fg">BMI: <span className="font-bold">{bmi}</span> ({bmiCategory})</p>
                          <p className="text-xs text-fg-muted mt-1">{smartSuggestion}</p>
                          {aiSuggestions && (
                            <p className="text-xs text-brand mt-1">AI suggests: {aiSuggestions.suggestedGoal} goal, target ~{aiSuggestions.suggestedTargetWeight}kg</p>
                          )}
                          {fetchingAI && <p className="text-xs text-fg-subtle mt-1">AI analyzing...</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Age" type="number" placeholder="e.g. 25" error={errors.age?.message} {...register('age', { required: 'Required', min: { value: 10, message: 'Min 10' }, max: { value: 120, message: 'Max 120' } })} />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-fg-muted">Gender</label>
                      <select className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg focus:border-brand focus:outline-none" {...register('gender', { required: true })}>
                        {genders.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                    <Input label="Height (cm)" type="number" placeholder="e.g. 175" error={errors.height?.message} {...register('height', { required: 'Required', min: { value: 50, message: 'Min 50' }, max: { value: 300, message: 'Max 300' } })} />
                    <Input label="Weight (kg)" type="number" placeholder="e.g. 70" error={errors.weight?.message} {...register('weight', { required: 'Required', min: { value: 20, message: 'Min 20' }, max: { value: 500, message: 'Max 500' } })} />
                  </div>

                  <div className="mt-6 flex items-center justify-end">
                    <Button type="button" onClick={handleNext}>Continue</Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoOptionsOutline className="mx-auto mb-2 text-3xl text-water sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Your Goal & Lifestyle</h2>
                    <p className="mt-1 text-sm text-fg-muted">AI-suggested based on your BMI. Adjust as needed.</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-fg-muted">Goal ({aiSuggestions?.suggestedGoal ? 'AI-suggested' : 'auto-selected'})</label>
                    <div className="grid grid-cols-3 gap-2">
                      {goals.map(g => (
                        <button key={g.value} type="button"
                          className={`p-3 rounded-lg border-2 text-center transition-all ${watchedFields.goal === g.value ? 'border-brand bg-brand/10 text-brand' : 'border-border-default bg-surface-muted text-fg-muted hover:border-brand/50'}`}
                          onClick={() => {
                            setValue('goal', g.value);
                            const w = Number(watchedFields.weight || 0);
                            if (g.value === 'maintain') setTargetWeight(w);
                            else if (g.value === 'gain') setTargetWeight(+(w * 1.08).toFixed(1));
                            else setTargetWeight(+(w * 0.92).toFixed(1));
                          }}>
                          <div className="text-lg mb-0.5">{g.label.split(' ')[0]}</div>
                          <div className="text-[10px]">{g.label.split(' ').slice(1).join(' ')}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-fg-muted">Target Weight (kg)</label>
                      <input type="number" value={targetWeight} onChange={e => setTargetWeight(e.target.value)}
                        className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg focus:border-brand focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-fg-muted">Activity Level</label>
                      <select className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg focus:border-brand focus:outline-none" {...register('activityLevel', { required: true })}>
                        {activityLevels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {watchedFields.goal && (
                    <div className="rounded-lg bg-surface-muted p-4">
                      <div className="flex items-start gap-3">
                        <IoBulbOutline className="text-brand text-xl mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-fg">Plan Preview</p>
                          <p className="text-xs text-fg-muted mt-1">
                            {watchedFields.goal === 'lose' && 'Calorie deficit to lose weight safely.'}
                            {watchedFields.goal === 'gain' && 'Calorie surplus to gain weight.'}
                            {watchedFields.goal === 'maintain' && 'Maintain weight with balanced nutrition.'}
                            {' '}Next step: customize your meals and schedule.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-border-default pt-4">
                    <Button variant="secondary" type="button" onClick={handleBack}>Back</Button>
                    <Button type="button" onClick={handleNext}>Continue</Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="space-y-5">
                  <div className="text-center sm:text-left">
                    <IoRestaurantOutline className="mx-auto mb-2 text-3xl text-brand sm:mx-0" />
                    <h2 className="text-xl font-bold text-fg">Dietary & Lifestyle Details</h2>
                    <p className="mt-1 text-sm text-fg-muted">Fine-tune your plan with your preferences.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-fg-muted">Food Preference</label>
                      <select className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg focus:border-brand focus:outline-none" {...register('foodPreference')}>
                        {foodPreferences.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-fg-muted">Cuisine Preference</label>
                      <select className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg focus:border-brand focus:outline-none" {...register('cuisinePreference')}>
                        {cuisinePreferences.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-fg-muted">Meals per Day</label>
                      <select className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg focus:border-brand focus:outline-none" {...register('mealFrequency')}>
                        {mealFrequencyOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-fg-muted">Cooking Time</label>
                      <select className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg focus:border-brand focus:outline-none" {...register('cookingTimePreference')}>
                        {cookingTimeOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-border-default pt-4">
                    <h3 className="text-sm font-semibold text-fg mb-3">Daily Schedule</h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <Input label="Wake Up" type="time" {...register('wakeTime')} />
                      <Input label="Sleep Time" type="time" {...register('sleepTime')} />
                      <Input label="Sleep Hours" type="number" {...register('sleepHours')} />
                      <Input label="Work Start" type="time" {...register('workStart')} />
                      <Input label="Work End" type="time" {...register('workEnd')} />
                    </div>
                  </div>

                  <div className="border-t border-border-default pt-4">
                    <h3 className="text-sm font-semibold text-fg mb-3">Fitness</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-fg-muted">Exercise Days/Week</label>
                        <select className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg focus:border-brand focus:outline-none" {...register('exerciseDays')}>
                          {[0,1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{d} days</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-fg-muted">Workout Type</label>
                        <select className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg focus:border-brand focus:outline-none" {...register('preferredWorkoutType')}>
                          {workoutTypes.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border-default pt-4">
                    <h3 className="text-sm font-semibold text-fg mb-3">Health</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input label="Medical Conditions (comma-separated)" placeholder="e.g. diabetes, hypertension" {...register('medicalConditions')} />
                      <Input label="Allergies (comma-separated)" placeholder="e.g. peanuts, lactose" {...register('allergies')} />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-border-default pt-4">
                    <Button variant="secondary" type="button" onClick={handleBack} disabled={loading}>Back</Button>
                    <Button type="submit" loading={loading}>
                      <IoSparklesOutline className="inline mr-1" />
                      Generate AI Plan
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

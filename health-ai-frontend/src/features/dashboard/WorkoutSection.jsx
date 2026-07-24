import React from 'react';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { IoWalkOutline, IoFitnessOutline, IoTimeOutline, IoFlameOutline } from 'react-icons/io5';

const WorkoutSection = ({ workout }) => {
  if (!workout) return null;

  const hasMorning = workout.morning && workout.morning.length > 0;
  const hasEvening = workout.evening && workout.evening.length > 0;
  const hasWorkouts = hasMorning || hasEvening;

  return (
    <Card className="flex flex-col gap-4" glow>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <IoWalkOutline size={26} className="shrink-0 animate-pulse text-brand" />
          <div>
            <h3 className="text-lg font-bold text-fg">Workout Schedule</h3>
            <p className="text-sm text-fg-muted">Recommended exercise templates matching goal</p>
          </div>
        </div>

        {hasWorkouts && (
          <div className="flex gap-3 rounded-lg bg-surface-muted px-3 py-2 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-1">
              <IoTimeOutline /> {workout.duration || '30 Min'}
            </span>
            <span className="inline-flex items-center gap-1">
              <IoFlameOutline /> {workout.caloriesBurn || '150'} kcal
            </span>
          </div>
        )}
      </div>

      {!hasWorkouts ? (
        <EmptyState
          icon={<IoFitnessOutline size={40} />}
          title="Active Recovery Day"
          description="Your workout template is light today. Focus on flexibility, hydration, and light walking (~5,000 steps)."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {hasMorning && (
            <div className="rounded-lg bg-surface-muted p-4">
              <h4 className="mb-3 font-semibold text-fg">Morning Session</h4>
              <ul className="space-y-2">
                {workout.morning.map((exercise, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-fg-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{exercise}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasEvening && (
            <div className="rounded-lg bg-surface-muted p-4">
              <h4 className="mb-3 font-semibold text-fg">Evening Session</h4>
              <ul className="space-y-2">
                {workout.evening.map((exercise, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-fg-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{exercise}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default WorkoutSection;

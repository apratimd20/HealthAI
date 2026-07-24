import React from 'react';
import Card from '../../components/ui/Card';
import { IoRibbonOutline } from 'react-icons/io5';

const GoalSummary = ({ goalData, onUpdateGoal }) => {
  if (!goalData) return null;

  return (
    <Card className="flex flex-col gap-4" glow>
      <div className="flex items-start gap-3">
        <IoRibbonOutline size={28} className="shrink-0 text-brand" />
        <div>
          <h3 className="text-lg font-bold text-fg">Goal Profile</h3>
          <p className="text-sm text-fg-muted">Active health recommendation parameters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-surface-muted p-3">
          <span className="text-xs uppercase tracking-wide text-fg-subtle">Primary Goal</span>
          <p className="mt-1 font-semibold text-brand">{goalData.goal}</p>
        </div>
        <div className="rounded-md bg-surface-muted p-3">
          <span className="text-xs uppercase tracking-wide text-fg-subtle">Biometrics</span>
          <p className="mt-1 text-sm text-fg">
            {goalData.weight} kg → {goalData.targetWeight} kg
          </p>
        </div>
        <div className="rounded-md bg-surface-muted p-3">
          <span className="text-xs uppercase tracking-wide text-fg-subtle">Activity Level</span>
          <p className="mt-1 text-sm text-fg">{goalData.activityLevel}</p>
        </div>
        <div className="rounded-md bg-surface-muted p-3">
          <span className="text-xs uppercase tracking-wide text-fg-subtle">Food Preference</span>
          <p className="mt-1 text-sm text-fg">{goalData.foodPreference}</p>
        </div>
        <div className="rounded-md bg-surface-muted p-3 sm:col-span-2">
          <span className="text-xs uppercase tracking-wide text-fg-subtle">
            Medical / Allergies
          </span>
          <p className="mt-1 text-sm text-fg">
            {goalData.medicalConditions?.length > 0
              ? goalData.medicalConditions.join(', ')
              : 'None'}{' '}
            /{' '}
            {goalData.allergies?.length > 0 ? goalData.allergies.join(', ') : 'None'}
          </p>
        </div>
      </div>

      {onUpdateGoal && (
        <button
          type="button"
          onClick={onUpdateGoal}
          className="text-left text-sm font-medium text-brand hover:text-brand-hover"
        >
          Update goal profile →
        </button>
      )}
    </Card>
  );
};

export default GoalSummary;

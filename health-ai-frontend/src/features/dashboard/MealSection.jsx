import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import {
  IoRestaurantOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoFlameOutline,
} from 'react-icons/io5';

const MealSection = ({ meals }) => {
  const [expandedMeal, setExpandedMeal] = useState(null);

  const getActiveMealKey = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 19) return 'snacks';
    if (hour >= 19 && hour < 24) return 'dinner';
    return '';
  };

  React.useEffect(() => {
    const activeKey = getActiveMealKey();
    setExpandedMeal(activeKey || 'breakfast');
  }, [meals]);

  if (!meals) return null;

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', data: meals.breakfast },
    { key: 'lunch', label: 'Lunch', data: meals.lunch },
    { key: 'snacks', label: 'Snacks', data: meals.snacks },
    { key: 'dinner', label: 'Dinner', data: meals.dinner },
  ];

  const toggleExpand = (mealKey) => {
    setExpandedMeal(expandedMeal === mealKey ? null : mealKey);
  };

  const currentActiveKey = getActiveMealKey();

  return (
    <Card className="flex flex-col gap-4" glow>
      <div className="flex items-start gap-3">
        <IoRestaurantOutline size={24} className="shrink-0 text-calories" />
        <div>
          <h3 className="text-lg font-bold text-fg">Today&apos;s Diet Plan</h3>
          <p className="text-sm text-fg-muted">Calculated portions matching your preference</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {mealTypes.map(({ key, label, data }) => {
          const isExpanded = expandedMeal === key;
          const foods = data?.foods || [];
          const totalCalories = data?.totalCalories || 0;
          const targetCalories = data?.targetCalories || 0;

          return (
            <div
              key={key}
              className={`overflow-hidden rounded-lg border transition-colors ${isExpanded ? 'border-brand/40 bg-surface-muted' : 'border-border-default bg-surface-base'}`}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                onClick={() => toggleExpand(key)}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-fg">{label}</span>
                    {currentActiveKey === key && (
                      <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">
                        Active Now
                      </span>
                    )}
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm text-fg-muted">
                    <IoFlameOutline /> {totalCalories} kcal / {targetCalories} target
                  </span>
                </div>
                <span className="text-fg-muted">
                  {isExpanded ? <IoChevronUpOutline size={20} /> : <IoChevronDownOutline size={20} />}
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-border-default px-4 py-3">
                  {foods.length === 0 ? (
                    <p className="text-sm text-fg-muted">
                      No structured foods seeded for this caloric range.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {foods.map((food) => (
                        <div
                          key={food._id || food.name}
                          className="grid gap-2 border-b border-border-default/60 pb-3 last:border-0 last:pb-0 sm:grid-cols-[1fr_auto_auto_auto]"
                        >
                          <div>
                            <p className="font-medium text-fg">{food.name}</p>
                            <p className="text-xs text-fg-subtle">{food.category}</p>
                          </div>
                          <p className="text-sm text-fg-muted">
                            {food.servingSize}
                            {food.servingUnit || 'g'}
                          </p>
                          <p className="text-xs text-fg-muted">
                            <span className="text-brand">P:{food.protein}g</span>{' '}
                            <span className="text-calories">C:{food.carbs}g</span>{' '}
                            <span className="text-sleep">F:{food.fat}g</span>
                          </p>
                          <p className="text-sm font-semibold text-fg">{food.calories} kcal</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default MealSection;

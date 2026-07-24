import React from 'react';
import Card from '../../components/ui/Card';

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  bgColor = 'bg-orange-500/10',
  textColor = 'text-orange-400',
}) => {
  return (
    <Card className="flex min-h-[150px] flex-col justify-between" accentColor={accentColor} glow>
      <div className="mb-5 flex items-start justify-between">
        <span className="text-sm font-semibold uppercase tracking-wider text-fg-muted">{title}</span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor} ${textColor}`}
        >
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-3xl font-bold tracking-tight text-fg">{value}</h3>
        {subtitle && <p className="text-sm text-fg-muted">{subtitle}</p>}
      </div>
    </Card>
  );
};

export default MetricCard;

// src/components/admin/ChartCard.jsx
import React from 'react';

const ChartCard = ({ title, subtitle, children, action, className = '' }) => {
  return (
    <div className={`rounded-2xl border border-border-default bg-surface-card p-5 shadow-[0_12px_30px_rgba(0,0,0,0.16)] ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-fg">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-fg-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
};

export default ChartCard;
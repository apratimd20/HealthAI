// src/components/admin/Badge.jsx
import React from 'react';

const toneClasses = {
  emerald: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30',
  amber: 'bg-amber-500/15 text-amber-300 border border-amber-400/30',
  red: 'bg-red-500/15 text-red-300 border border-red-400/30',
  violet: 'bg-violet-500/15 text-violet-300 border border-violet-400/30',
  sky: 'bg-sky-500/15 text-sky-300 border border-sky-400/30',
  slate: 'bg-slate-500/15 text-slate-200 border border-slate-500/30',
  white: 'bg-white/10 text-white border border-white/20',
};

const Badge = ({ tone = 'slate', children, className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses[tone] || toneClasses.slate} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;

// Sentinel color maps used across modules to keep label→tone consistent in one place.
export const SENTIMENT_TONES = {
  Happy: 'emerald',
  Satisfied: 'sky',
  Neutral: 'slate',
  Confused: 'amber',
  Angry: 'red',
  Frustrated: 'red',
  Emergency: 'violet',
};

export const POST_STATUS_TONES = {
  active: 'emerald',
  hidden: 'amber',
  deleted: 'red',
};
// src/components/admin/StatCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ label, value, accent = 'text-brand', icon, hint, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl border border-border-default bg-surface-card p-5 shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:border-brand/25"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        {icon && <span className={`text-lg ${accent}`}>{icon}</span>}
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <h2 className={`text-3xl font-bold tracking-tight ${accent}`}>{value}</h2>
        {hint && <span className="shrink-0 text-xs font-medium text-fg-muted">{hint}</span>}
      </div>
    </motion.div>
  );
};

export default StatCard;
// src/components/admin/SkeletonTable.jsx
import React from 'react';

// Lightweight table loading skeleton with a fixed set of shimmer rows.
const SkeletonTable = ({ columns = 4, rows = 6 }) => {
  return (
    <div className="animate-pulse">
      <div className="h-10 rounded-t-lg bg-surface-muted" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-t border-border-default px-5 py-4">
          {Array.from({ length: columns }).map((__, c) => (
            <div
              key={c}
              className={`h-4 rounded bg-surface-muted ${c === 0 ? 'w-1/4' : c === 1 ? 'w-1/3' : 'w-16'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SkeletonTable;
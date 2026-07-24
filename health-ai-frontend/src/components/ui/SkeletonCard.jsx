import React from 'react';

const SkeletonCard = ({ rows = 3, className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded-lg border border-border-default bg-surface-card p-5 ${className}`}
    >
      <div className="mb-4 h-5 w-1/3 rounded bg-border-default" />
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={`mb-2 h-4 rounded bg-border-default/70 ${index === rows - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

export default SkeletonCard;

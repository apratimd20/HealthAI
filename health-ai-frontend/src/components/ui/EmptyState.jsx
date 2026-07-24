import React from 'react';

const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-brand">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-fg">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;

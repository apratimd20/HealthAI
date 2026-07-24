import React, { forwardRef } from 'react';

const Input = forwardRef(
  ({ label, type = 'text', error, icon, className = '', id, ...props }, ref) => {
    const inputId =
      id ||
      `input-${label ? label.toLowerCase().replace(/\s+/g, '-') : Math.random().toString(36).slice(2, 11)}`;

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-fg-muted">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={`w-full rounded-md border bg-surface-base py-2.5 text-sm text-fg transition-colors placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand ${icon ? 'pl-10 pr-3' : 'px-3'} ${error ? 'border-danger' : 'border-border-default'}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;

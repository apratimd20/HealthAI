import React from 'react';

const variantClasses = {
  primary:
    'bg-brand text-white hover:bg-brand-hover shadow-[0_0_15px_rgba(16,185,129,0.25)] border border-transparent',
  secondary:
    'bg-surface-card text-fg border border-border-default hover:bg-surface-card-hover',
  outline:
    'bg-transparent text-fg border border-border-default hover:border-brand hover:text-brand',
  text: 'bg-transparent text-fg-muted hover:text-fg border border-transparent',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  icon,
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${loading ? 'relative' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {!loading && icon && <span className="flex shrink-0 items-center">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export default Button;

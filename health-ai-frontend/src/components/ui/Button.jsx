import React from 'react';

const variantClasses = {
  primary:
    'bg-brand text-slate-950 border border-brand hover:bg-brand-hover shadow-[0_10px_24px_rgba(34,197,94,0.22)]',
  secondary:
    'bg-surface-card text-fg border border-border-default hover:bg-surface-card-hover hover:border-brand/30',
  outline:
    'bg-transparent text-fg border border-border-default hover:border-brand hover:text-brand',
  danger:
    'bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/15',
  text: 'bg-transparent text-fg-muted hover:text-fg border border-transparent',
};

const sizeClasses = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2.5',
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
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const hasIcon = !loading && icon;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl font-medium tracking-[-0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${loading ? 'relative' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {!loading && hasIcon && iconPosition === 'left' && (
        <span className="flex shrink-0 items-center">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && hasIcon && iconPosition === 'right' && (
        <span className="flex shrink-0 items-center">{icon}</span>
      )}
    </button>
  );
};

export default Button;

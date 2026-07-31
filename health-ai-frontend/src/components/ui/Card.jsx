import React from 'react';
import { motion } from 'framer-motion';
import { cardHover } from '../../animations/variants';

const Card = ({
  children,
  onClick,
  hoverable = false,
  className = '',
  accentColor,
  glow = false,
  ...props
}) => {
  const isInteractive = !!onClick || hoverable;
  const Component = isInteractive ? motion.div : 'div';
  const motionProps = isInteractive ? { whileHover: cardHover } : {};

  const style = accentColor ? { borderTop: `3px solid ${accentColor}` } : {};

  return (
    <Component
      style={style}
      className={`rounded-2xl border border-border-default bg-surface-card p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] sm:p-5 ${glow ? 'shadow-[0_12px_30px_rgba(34,197,94,0.08)]' : ''} ${isInteractive ? 'cursor-pointer transition-colors hover:border-brand/20 hover:bg-surface-card-hover' : ''} ${className}`}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;

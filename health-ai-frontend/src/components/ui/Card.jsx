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

  const style = accentColor ? { borderTop: `4px solid ${accentColor}` } : {};

  return (
    <Component
      style={style}
      className={`rounded-lg border border-border-default bg-surface-card p-5 ${glow ? 'shadow-[0_0_20px_rgba(16,185,129,0.08)]' : ''} ${isInteractive ? 'cursor-pointer transition-colors hover:bg-surface-card-hover' : ''} ${className}`}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;

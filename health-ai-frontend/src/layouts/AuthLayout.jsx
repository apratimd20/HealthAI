import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../animations/variants';
import { IoFitnessOutline } from 'react-icons/io5';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-surface-base px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-brand/20 blur-[100px]" />
        <div className="absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-sleep/20 blur-[100px]" />
      </div>

      <motion.div
        className="glass-panel relative z-10 w-full max-w-md rounded-2xl p-8 shadow-xl"
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 text-brand">
            <IoFitnessOutline className="h-7 w-7" />
          </div>
          <span className="text-sm font-semibold uppercase tracking-widest text-brand">Health AI</span>
          <h1 className="mt-3 text-2xl font-bold text-fg">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-fg-muted">{subtitle}</p>}
        </div>
        <div>{children}</div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;

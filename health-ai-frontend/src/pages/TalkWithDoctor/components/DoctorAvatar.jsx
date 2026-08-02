import React from 'react';
import { motion } from 'framer-motion';

const STATUS_GLOW = {
  idle: '#10b981',
  listening: '#f43f5e',
  thinking: '#f59e0b',
  speaking: '#10b981',
  muted: '#64748b',
  ended: '#64748b',
};

const STATUS_LABEL = {
  idle: 'Ready to start',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
  muted: 'Muted',
  ended: 'Call ended',
};

export default function DoctorAvatar({ status = 'idle', isSpeaking = false }) {
  const glowColor = STATUS_GLOW[status] || STATUS_GLOW.idle;
  const label = STATUS_LABEL[status] || STATUS_LABEL.idle;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center rounded-[28px] border border-slate-700/70 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_rgba(15,23,42,0.97)_60%)] shadow-[inset_0_0_60px_rgba(16,185,129,0.06)]">
      {/* Center placeholder */}
      <div className="flex flex-col items-center gap-4 text-center px-6">
        {/* Animated pulse ring */}
        <motion.div
          className="relative"
          style={{ filter: `drop-shadow(0 0 24px ${glowColor})` }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex h-40 w-40 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-emerald-500/10"
          >
            <svg
              className="h-16 w-16 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </motion.div>

          {/* Speaking/listening pulse ring */}
          {(isSpeaking || status === 'listening') && (
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: glowColor }}
            />
          )}
        </motion.div>

        {/* "Avatar coming soon" text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-sm font-medium text-slate-400"
        >
          Avatar coming soon
        </motion.p>

        {/* Status label */}
        <motion.p
          key={status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-xs font-semibold text-slate-300"
          style={{ color: glowColor }}
        >
          {label}
        </motion.p>
      </div>

      {/* Subtle ambient glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px] transition-[box-shadow] duration-500"
        style={{
          boxShadow: `inset 0 0 0 2px ${glowColor}33, 0 0 40px ${glowColor}22`,
        }}
      />
    </div>
  );
}
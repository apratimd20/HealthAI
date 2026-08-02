import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMicOutline, IoMicOffOutline, IoHourglassOutline, IoVolumeHighOutline, IoCallOutline } from 'react-icons/io5';

/**
 * Status pill that reflects the current conversation state:
 * Listening / Thinking / Doctor is speaking / Microphone muted / Call ended.
 */
const STATUS_CONFIG = {
  idle: {
    label: 'Tap the mic to begin',
    icon: <IoMicOutline size={14} />,
    color: 'text-slate-300',
    border: 'border-slate-700 bg-slate-800/80',
  },
  listening: {
    label: 'Listening...',
    icon: <IoMicOutline size={14} />,
    color: 'text-rose-200',
    border: 'border-rose-500/50 bg-rose-500/10',
    pulse: true,
  },
  thinking: {
    label: 'Thinking...',
    icon: <IoHourglassOutline size={14} />,
    color: 'text-amber-200',
    border: 'border-amber-400/50 bg-amber-500/10',
  },
  speaking: {
    label: 'Doctor is speaking...',
    icon: <IoVolumeHighOutline size={14} />,
    color: 'text-emerald-200',
    border: 'border-emerald-500/50 bg-emerald-500/10',
    pulse: true,
  },
  muted: {
    label: 'Microphone muted',
    icon: <IoMicOffOutline size={14} />,
    color: 'text-slate-400',
    border: 'border-slate-600 bg-slate-800/80',
  },
  ended: {
    label: 'Call ended',
    icon: <IoCallOutline size={14} />,
    color: 'text-slate-400',
    border: 'border-slate-700 bg-slate-800/80',
  },
};

const ConversationStatus = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${config.border} ${config.color}`}
      >
        <motion.span
          animate={config.pulse ? { opacity: [1, 0.4, 1] } : {}}
          transition={config.pulse ? { duration: 1.2, repeat: Infinity } : {}}
          className="flex items-center"
        >
          {config.icon}
        </motion.span>
        {config.label}
      </motion.div>
    </AnimatePresence>
  );
};

export default ConversationStatus;

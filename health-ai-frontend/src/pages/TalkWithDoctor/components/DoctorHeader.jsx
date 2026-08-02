import React from 'react';
import { motion } from 'framer-motion';
import { IoChevronBackOutline, IoMedkitOutline } from 'react-icons/io5';

/**
 * Compact video-call top bar: back button, doctor identity, live badge.
 */
const DoctorHeader = ({ onEndCall }) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-20 flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5"
    >
      <button
        type="button"
        onClick={onEndCall}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
        aria-label="Leave call"
      >
        <IoChevronBackOutline size={16} />
        <span className="hidden sm:inline">Leave</span>
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25">
          <IoMedkitOutline size={20} />
        </div>
        <div className="text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
            AI Health Assistant
          </p>
          <h1 className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
            AI Doctor
          </h1>
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Live
      </div>
    </motion.header>
  );
};

export default DoctorHeader;

import React from 'react';
import { motion } from 'framer-motion';
import {
  IoMicOutline,
  IoMicOffOutline,
  IoVideocamOutline,
  IoChatbubbleEllipsesOutline,
  IoCallOutline,
} from 'react-icons/io5';

/**
 * Floating bottom-center controls, styled like a video-call app.
 *
 * - Mic: toggles mute/unmute.
 * - Camera: intentionally disabled for Phase 2 (webcam arrives in Phase 3).
 * - Chat: slides open the right-side chat drawer.
 * - End call: large red button that stops everything and returns to dashboard.
 */
const CallControls = ({
  isMicMuted,
  isListening,
  isChatOpen,
  onToggleMic,
  onToggleChat,
  onEndCall,
}) => {
  const controls = [
    {
      key: 'mic',
      label: isMicMuted ? 'Unmute' : 'Mute',
      icon: isMicMuted ? (
        <IoMicOffOutline size={22} />
      ) : (
        <IoMicOutline size={22} />
      ),
      active: !isMicMuted,
      highlighted: isListening && !isMicMuted,
      onClick: onToggleMic,
    },
    {
      key: 'camera',
      label: 'Camera',
      icon: <IoVideocamOutline size={22} />,
      active: false,
      disabled: true,
      onClick: () => undefined,
    },
    {
      key: 'chat',
      label: 'Chat',
      icon: <IoChatbubbleEllipsesOutline size={22} />,
      active: isChatOpen,
      onClick: onToggleChat,
    },
  ];

  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 px-3">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="flex items-center gap-2.5 rounded-full border border-slate-700/80 bg-slate-900/80 p-2.5 shadow-[0_20px_60px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:gap-3"
      >
        {controls.map((control) => (
          <motion.button
            key={control.key}
            type="button"
            whileHover={control.disabled ? undefined : { scale: 1.05 }}
            whileTap={control.disabled ? undefined : { scale: 0.95 }}
            onClick={control.onClick}
            disabled={control.disabled}
            className={`relative flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200 sm:h-13 sm:w-13 ${
              control.active
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                : 'border-slate-700 bg-slate-800 text-slate-200'
            } ${
              control.highlighted
                ? 'ring-2 ring-rose-400/60 shadow-[0_0_0_6px_rgba(244,63,94,0.15)]'
                : ''
            } ${control.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-700/60'}`}
            aria-label={control.label}
            title={control.disabled ? 'Camera coming soon' : control.label}
          >
            {control.icon}
          </motion.button>
        ))}

        {/* End call */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          onClick={onEndCall}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/60 bg-red-500 text-white shadow-[0_8px_30px_rgba(239,68,68,0.45)] transition-transform hover:bg-red-600 sm:h-13 sm:w-13"
          aria-label="End call"
          title="End call"
        >
          <IoCallOutline size={20} className="rotate-[135deg]" />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default CallControls;

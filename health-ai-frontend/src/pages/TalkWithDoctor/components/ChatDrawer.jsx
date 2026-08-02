import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline, IoChatbubbleEllipsesOutline, IoLockClosedOutline } from 'react-icons/io5';
import MessageBubble from './MessageBubble';

/**
 * Right-side chat drawer showing the live consultation history.
 * Desktop: ~380px. Mobile: full-width overlay.
 * Input is intentionally disabled — this module is voice-first.
 */
const ChatDrawer = ({ isOpen, onClose, messages }) => {
  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />

          <motion.aside
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[380px] flex-col border-l border-slate-700/80 bg-slate-950/95 shadow-[0_0_60px_rgba(15,23,42,0.6)] backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <IoChatbubbleEllipsesOutline size={16} className="text-emerald-300" />
                Consultation Chat
                <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                  {messages.length}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                aria-label="Close chat"
              >
                <IoCloseOutline size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} role={message.role} text={message.text} />
              ))}
              <div ref={endRef} />
            </div>

            {/* Disabled input */}
            <div className="border-t border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-400">
                <IoLockClosedOutline size={13} className="shrink-0 text-slate-500" />
                Voice-first mode: typing is disabled during the live consultation.
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatDrawer;

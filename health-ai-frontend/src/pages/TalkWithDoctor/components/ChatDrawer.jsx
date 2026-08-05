import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoCloseOutline,
  IoChatbubbleEllipsesOutline,
  IoSendOutline,
  IoMicOutline,
} from 'react-icons/io5';
import MessageBubble from './MessageBubble';

/**
 * Right-side chat drawer showing the live consultation history.
 * Desktop: ~380px. Mobile: full-width overlay.
 *
 * Text chat is fully supported alongside voice: type a message, press Enter,
 * or tap the Send button. Typed messages flow through the SAME backend
 * endpoint and share the same conversation history as voice input.
 */
const ChatDrawer = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isThinking = false,
  isDisabled = false,
}) => {
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Focus the input shortly after the drawer slides in.
      const timer = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || isThinking || isDisabled) return;
    onSendMessage?.(text);
    setDraft('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = draft.trim().length > 0 && !isThinking && !isDisabled;

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
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[380px] flex-col border-l border-slate-700/80 bg-slate-950/95 shadow-[0_0_60px_rgba(15,23,42,0.6)] backdrop-blur-xl sm:max-w-[420px]"
            role="dialog"
            aria-label="Consultation chat"
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
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  text={message.text}
                  timestamp={message.timestamp}
                />
              ))}

              {/* Typing indicator */}
              {isThinking && (
                <div className="flex items-end gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <IoChatbubbleEllipsesOutline size={14} />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-700/70 bg-slate-800/90 px-4 py-3">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:240ms]" />
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Text input */}
            <div className="border-t border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={isDisabled}
                  aria-label="Type a message"
                  className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  aria-label="Send message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <IoSendOutline size={18} />
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
                <IoMicOutline size={12} />
                Voice and text share the same consultation. Responses are informational only.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatDrawer;

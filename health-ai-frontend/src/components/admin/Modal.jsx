// src/components/admin/Modal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline } from 'react-icons/io5';

const Modal = ({ open, onClose, title, subtitle, children, footer, size = 'md' }) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className={`relative z-10 w-full ${sizes[size]} max-h-[90vh] overflow-hidden rounded-2xl border border-border-default bg-surface-card shadow-[0_24px_80px_rgba(0,0,0,0.55)]`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border-default px-6 py-4">
              <div>
                {subtitle && <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-fg-subtle">{subtitle}</p>}
                <h3 className="mt-0.5 text-lg font-bold text-fg">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-fg-muted transition hover:bg-surface-muted hover:text-fg"
                aria-label="Close"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="max-h-[calc(90vh-7rem)] overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-border-default px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
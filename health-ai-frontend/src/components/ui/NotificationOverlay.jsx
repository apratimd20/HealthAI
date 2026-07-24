import React, { useState, useEffect } from 'react';
import { healthService } from '../../services/healthService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoNotificationsOutline,
  IoCloseOutline,
  IoFastFoodOutline,
  IoWaterOutline,
  IoBedOutline,
} from 'react-icons/io5';

export default function NotificationOverlay({ refreshTrigger }) {
  const [notifications, setNotifications] = useState([]);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const currentHour = new Date().getHours();
        const response = await healthService.getNotifications(currentHour);
        if (response.success && response.data) {
          setNotifications(response.data);
          setClosed(false);
        }
      } catch (error) {
        console.error('Failed to load timed recommendations:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  if (closed || notifications.length === 0) return null;

  const getIcon = (type) => {
    const base = 'text-xl';
    switch (type) {
      case 'eat':
        return <IoFastFoodOutline className={`${base} text-calories`} />;
      case 'drink':
        return <IoWaterOutline className={`${base} text-water`} />;
      case 'sleep':
        return <IoBedOutline className={`${base} text-sleep`} />;
      default:
        return <IoNotificationsOutline className={`${base} text-brand`} />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="glass-panel fixed right-4 top-20 z-40 w-[min(100%,22rem)] rounded-xl border border-white/10 p-4 shadow-xl"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand">
            <IoNotificationsOutline />
            <span>Health AI Recommend</span>
          </div>
          <button
            type="button"
            className="text-fg-muted hover:text-fg"
            onClick={() => setClosed(true)}
          >
            <IoCloseOutline size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {notifications.map((item, index) => (
            <div key={index} className="flex gap-3 text-left">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                {getIcon(item.type)}
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                  {item.category}
                </span>
                <p className="text-sm text-fg-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

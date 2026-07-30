// src/components/ui/NotificationOverlay.jsx
import React, { useState, useEffect } from 'react';
import { healthService } from '../../services/healthService';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '../../services/notificationService';
import {
  IoNotificationsOutline,
  IoCloseOutline,
  IoFastFoodOutline,
  IoWaterOutline,
  IoBedOutline,
  IoFitnessOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5';

export default function NotificationOverlay({ refreshTrigger }) {
  const [notifications, setNotifications] = useState([]);
  const [closed, setClosed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const currentHour = new Date().getHours();
        const response = await healthService.getNotifications(currentHour);
        if (response.success && response.data) {
          setNotifications(response.data);
          setClosed(false);
          
          // Send push notification if enabled
          if (notificationService.isSupported && response.data.length > 0) {
            const topNotification = response.data[0];
            await sendPushNotification(topNotification);
          }
        }
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const sendPushNotification = async (notification) => {
    try {
      // Check if notification permission is granted
      if (Notification.permission === 'granted') {
        const title = getNotificationTitle(notification.category);
        const body = notification.text;
        
        // Use Service Worker for push if available
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification(title, {
            body: body,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            tag: `health-${Date.now()}`,
            requireInteraction: true,
            vibrate: [200, 100, 200],
          });
        } else {
          // Fallback to regular notification
          new Notification(title, {
            body: body,
            icon: '/icon-192.png',
          });
        }
      }
    } catch (error) {
      console.error('Push notification error:', error);
    }
  };

  const getNotificationTitle = (category) => {
    const titles = {
      'Breakfast': 'Breakfast Time',
      'Lunch': 'Lunch Time',
      'Dinner': 'Dinner Time',
      'Snack': 'Snack Time',
      'Hydration': 'Water Reminder',
      'Sleep': 'Sleep Time',
      'Fitness': 'Workout Time',
      'Health': 'Health Reminder',
    };
    return titles[category] || 'Health AI Reminder';
  };

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
      case 'exercise':
        return <IoFitnessOutline className={`${base} text-brand`} />;
      default:
        return <IoNotificationsOutline className={`${base} text-brand`} />;
    }
  };

  if (isMobile) {
    // Mobile version - smaller, swipeable
    return (
      <AnimatePresence>
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-lg border-t border-white/10 p-4 shadow-xl"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/20">
              <IoNotificationsOutline className="text-brand text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-fg">
                {notifications[0]?.category || 'Recommendation'}
              </p>
              <p className="text-xs text-fg-muted line-clamp-2">
                {notifications[0]?.text}
              </p>
              {notifications.length > 1 && (
                <p className="text-xs text-fg-subtle mt-1">
                  +{notifications.length - 1} more tips
                </p>
              )}
            </div>
            <button
              type="button"
              className="shrink-0 text-fg-muted hover:text-fg p-1"
              onClick={() => setClosed(true)}
            >
              <IoCloseOutline size={20} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Desktop version - full list
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
            <span>Health Recommendations</span>
          </div>
          <button
            type="button"
            className="text-fg-muted hover:text-fg"
            onClick={() => setClosed(true)}
          >
            <IoCloseOutline size={18} />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {notifications.map((item, index) => (
            <motion.div
              key={index}
              className="flex gap-3 text-left p-2 rounded-lg hover:bg-white/5 transition-colors"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                {getIcon(item.type)}
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                  {item.category}
                </span>
                <p className="text-sm text-fg-muted">{item.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
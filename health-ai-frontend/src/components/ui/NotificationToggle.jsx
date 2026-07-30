// src/components/ui/NotificationToggle.jsx
import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { IoNotificationsOutline, IoNotificationsOffOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';

export default function NotificationToggle({ className = '' }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setEnabled(Notification.permission === 'granted');
    }
  }, []);

  const toggleNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported by your browser');
      return;
    }

    if (enabled) {
      setEnabled(false);
      toast('Notifications disabled for this session', { icon: '🔕' });
      return;
    }

    try {
      setLoading(true);
      toast.loading('Requesting notification permission...', { id: 'notif-perm' });

      const permission = await Notification.requestPermission();
      toast.dismiss('notif-perm');

      if (permission === 'granted') {
        setEnabled(true);
        toast.success('🔔 Notifications enabled! You will receive updates even when app is closed.');
        
        try {
          await notificationService.subscribeToPush();
        } catch (subErr) {
          console.log('Background push subscription note:', subErr);
        }
      } else if (permission === 'denied') {
        setEnabled(false);
        toast.error('❌ Notifications blocked. Please enable them in browser site settings.');
      } else {
        setEnabled(false);
        toast('Notification permission was not granted', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Toggle notification error:', error);
      toast.dismiss('notif-perm');
      toast.error('Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleNotifications}
      disabled={loading}
      className={`relative inline-flex h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
        enabled
          ? 'border-brand/40 bg-brand/15 text-brand shadow-[0_0_12px_rgba(16,185,129,0.2)]'
          : 'border-white/10 bg-surface-card text-fg-muted hover:border-white/20 hover:text-fg'
      } ${className}`}
      title={enabled ? 'Notifications Enabled (Click to toggle)' : 'Enable Notifications'}
    >
      {enabled ? (
        <IoNotificationsOutline size={16} className="animate-pulse text-brand" />
      ) : (
        <IoNotificationsOffOutline size={16} className="text-fg-subtle" />
      )}
      <span className="hidden sm:inline">
        {enabled ? 'Alerts ON' : 'Allow Alerts'}
      </span>

      {/* Small toggle indicator pill */}
      <span
        className={`ml-0.5 h-2 w-2 rounded-full transition-colors ${
          enabled ? 'bg-brand shadow-[0_0_8px_#10B981]' : 'bg-fg-subtle/40'
        }`}
      />
    </button>
  );
}

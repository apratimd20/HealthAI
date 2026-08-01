// src/services/notificationService.js
import api from './api';

class NotificationService {
  constructor() {
    this.swRegistration = null;
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
  }

  async init() {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      // Check if service worker is already registered
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        this.swRegistration = registrations[0];
      } else {
        // Register service worker
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      }
      console.log('Service Worker registered');

      // Check permission
      const permission = await this.requestPermission();
      return permission;
    } catch (error) {
      console.error('Notification init error:', error);
      return false;
    }
  }

  async requestPermission() {
    if (!this.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Subscribe to push
        await this.subscribeToPush();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  }

  async subscribeToPush() {
    try {
      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.ready;
      }

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY
        )
      });

      // Save subscription to server
      await api.post('/notifications/subscribe', {
        subscription: subscription
      });

      console.log('Push subscription successful');
      return subscription;
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async unsubscribeFromPush() {
    try {
      if (!('serviceWorker' in navigator)) return false;

      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (!registration.pushManager) continue;

        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      try {
        await api.post('/notifications/unsubscribe');
      } catch (error) {
        console.warn('Unsubscribe API call failed, continuing locally:', error);
      }

      return true;
    } catch (error) {
      console.error('Unsubscribe error:', error);
      throw error;
    }
  }

  async sendTestNotification() {
    try {
      const response = await api.post('/api/notifications/test');
      return response.data;
    } catch (error) {
      console.error('Test notification error:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
// src/services/healthService.js
import api from './api';

export const healthService = {
    setGoal: async (goalData) => {
        const response = await api.post('/health/setGoal', goalData);
        return response.data;
    },

    getActiveGoal: async () => {
        const response = await api.get('/health/activeGoal');
        return response.data;
    },

    getTodayPlan: async () => {
        const response = await api.get('/health/today');
        return response.data;
    },

    analyseFood: async (imageFile) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        const response = await api.post('/food/analyse', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    cancelGoal: async () => {
        const response = await api.put('/health/cancel');
        return response.data;
    },

    getNotifications: async (hour) => {
        const response = await api.get(`/health/notifications?hour=${hour}`);
        return response.data;
    },

    // Push notification methods
    subscribeToPush: async (subscription) => {
        const response = await api.post('/notifications/subscribe', { subscription });
        return response.data;
    },

    sendTestNotification: async () => {
        const response = await api.post('/notifications/test');
        return response.data;
    }
};
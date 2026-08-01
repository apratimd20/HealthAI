// src/services/healthService.js
import api from './api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function headers() {
    return { 'Content-Type': 'application/json', 'token': localStorage.getItem('token') || '' };
}

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

    getSuggestions: async (age, gender, height, weight) => {
        const response = await fetch(`${BASE_URL}/health/suggestions`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ age, gender, height, weight }),
        });
        if (!response.ok) throw new Error('Failed to get suggestions');
        return response.json();
    },

    getAIPlan: async () => {
        const response = await fetch(`${BASE_URL}/health/ai-plan`, {
            headers: headers(),
        });
        if (!response.ok) throw new Error('Failed to get AI plan');
        return response.json();
    },

    analyseFood: async (imageFile) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        const response = await api.post('/food/analyse', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
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

    subscribeToPush: async (subscription) => {
        const response = await api.post('/notifications/subscribe', { subscription });
        return response.data;
    },

    sendTestNotification: async () => {
        const response = await api.post('/notifications/test');
        return response.data;
    }
};
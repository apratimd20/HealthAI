// src/services/authService.js
import api from './api';

export const authService = {
    register: async (name, email, password) => {
        const response = await api.post('/user/register', { name, email, password });
        return response.data;
    },

    login: async (email, password) => {
        const response = await api.post('/user/login', { email, password });
        return response.data;
    },
};

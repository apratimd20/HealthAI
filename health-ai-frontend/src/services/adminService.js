// src/services/adminService.js
// Thin, typed wrapper around the app-wide axios instance for the admin panel.
// Reuses the auth token interceptor already configured in ./api.
import api from './api';

export const adminService = {
  // ===== Overview / analytics =====
  getOverview: async () => (await api.get('/admin/analytics/overview')).data,
  getChatActivity: async (params) => (await api.get('/admin/analytics/activity', { params })).data,
  getRegistrations: async (params) => (await api.get('/admin/analytics/registrations', { params })).data,
  getCommunityActivity: async (params) => (await api.get('/admin/analytics/community', { params })).data,
  getPeakHours: async () => (await api.get('/admin/analytics/peak-hours')).data,
  getSentiments: async () => (await api.get('/admin/analytics/sentiments')).data,
  getTopics: async () => (await api.get('/admin/analytics/topics')).data,
  getInsights: async () => (await api.get('/admin/analytics/insights')).data,

  // ===== Conversations =====
  getConversations: async (params) => (await api.get('/admin/conversations', { params })).data,
  getConversation: async (id) => (await api.get(`/admin/conversations/${id}`)).data,
  deleteConversation: async (id) => (await api.delete(`/admin/conversations/${id}`)).data,

  // ===== Users =====
  getUsers: async (params) => (await api.get('/admin/users', { params })).data,
  getUser: async (id) => (await api.get(`/admin/users/${id}`)).data,
  createUser: async (payload) => (await api.post('/admin/users', payload)).data,
  updateUser: async (id, payload) => (await api.put(`/admin/users/${id}`, payload)).data,
  setUserStatus: async (id, status) => (await api.patch(`/admin/users/${id}/status`, { status })).data,
  deleteUser: async (id) => (await api.delete(`/admin/users/${id}`)).data,

  // ===== Community =====
  getPosts: async (params) => (await api.get('/admin/community/posts', { params })).data,
  createPost: async (payload) => (await api.post('/admin/community/posts', payload)).data,
  updatePost: async (id, payload) => (await api.put(`/admin/community/posts/${id}`, payload)).data,
  setPostStatus: async (id, status) => (await api.patch(`/admin/community/posts/${id}/status`, { status })).data,
  deletePost: async (id) => (await api.delete(`/admin/community/posts/${id}`)).data,
};
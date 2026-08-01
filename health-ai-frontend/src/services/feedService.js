// src/services/feedService.js
import api from './api';

export const feedService = {
    // ============ POSTS ============
    
    /**
     * Create a new post
     * @param {FormData} formData - Form data with image, foodName, caption, nutrition
     */
    createPost: async (formData) => {
        const response = await api.post('/posts/create', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Get feed (timeline)
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     */
    getFeed: async (page = 1, limit = 20) => {
        const response = await api.get(`/posts/feed?page=${page}&limit=${limit}`);
        return response.data;
    },

    /**
     * Get trending posts
     * @param {number} limit - Number of posts
     */
    getTrending: async (limit = 10) => {
        const response = await api.get(`/posts/trending?limit=${limit}`);
        return response.data;
    },

    /**
     * Get user's posts
     * @param {string} userId - User ID (optional, defaults to current user)
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     */
    getUserPosts: async (userId, page = 1, limit = 20) => {
        const url = userId 
            ? `/posts/user/${userId}?page=${page}&limit=${limit}`
            : `/posts/user/me?page=${page}&limit=${limit}`;
        const response = await api.get(url);
        return response.data;
    },

    /**
     * Get single post by ID
     * @param {string} postId - Post ID
     */
    getPost: async (postId) => {
        const response = await api.get(`/posts/${postId}`);
        return response.data;
    },

    // ============ INTERACTIONS ============
    
    /**
     * Like or unlike a post
     * @param {string} postId - Post ID
     */
    toggleLike: async (postId) => {
        const response = await api.post(`/posts/${postId}/like`);
        return response.data;
    },

    /**
     * Add a comment to a post
     * @param {string} postId - Post ID
     * @param {string} text - Comment text
     */
    addComment: async (postId, text) => {
        const response = await api.post(`/posts/${postId}/comment`, { text });
        return response.data;
    },

    /**
     * Delete a comment
     * @param {string} postId - Post ID
     * @param {string} commentId - Comment ID
     */
    deleteComment: async (postId, commentId) => {
        const response = await api.delete(`/posts/${postId}/comment/${commentId}`);
        return response.data;
    },

    /**
     * Delete a post
     * @param {string} postId - Post ID
     */
    deletePost: async (postId) => {
        const response = await api.delete(`/posts/${postId}`);
        return response.data;
    },
};

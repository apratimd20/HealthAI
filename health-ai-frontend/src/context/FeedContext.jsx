// src/context/FeedContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { feedService } from '../services/feedService';
import toast from 'react-hot-toast';

const FeedContext = createContext(null);

export const FeedProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const isInitialLoad = useRef(true);

    // ============ LOAD FEED ============
    const loadFeed = useCallback(async (reset = true) => {
        if (loading && !reset) return;
        
        setLoading(true);
        try {
            const currentPage = reset ? 1 : page;
            const response = await feedService.getFeed(currentPage);
            
            if (response.success) {
                if (reset) {
                    setPosts(response.data);
                    setPage(2);
                } else {
                    setPosts(prev => [...prev, ...response.data]);
                    setPage(prev => prev + 1);
                }
                setHasMore(response.pagination?.hasMore || false);
            }
        } catch (error) {
            console.error('Load feed error:', error);
            toast.error('Failed to load feed');
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
        }
    }, [loading, page]);

    // ============ LOAD TRENDING ============
    const loadTrending = useCallback(async () => {
        try {
            const response = await feedService.getTrending();
            if (response.success) {
                setTrending(response.data);
            }
        } catch (error) {
            console.error('Load trending error:', error);
        }
    }, []);

    // ============ CREATE POST ============
    const createPost = useCallback(async (formData) => {
        setLoading(true);
        try {
            const response = await feedService.createPost(formData);
            if (response.success) {
                toast.success('🍽️ Post created successfully!');
                // Refresh feed to show new post
                await loadFeed(true);
                return response.data;
            }
        } catch (error) {
            console.error('Create post error:', error);
            toast.error(error.response?.data?.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    }, [loadFeed]);

    // ============ TOGGLE LIKE ============
    const toggleLike = useCallback(async (postId) => {
        try {
            const response = await feedService.toggleLike(postId);
            if (response.success) {
                // Update local state
                setPosts(prev => prev.map(post => {
                    if (post._id === postId) {
                        return {
                            ...post,
                            isLiked: response.data.isLiked,
                            likesCount: response.data.likesCount,
                        };
                    }
                    return post;
                }));
                // Also update trending
                setTrending(prev => prev.map(post => {
                    if (post._id === postId) {
                        return {
                            ...post,
                            isLiked: response.data.isLiked,
                            likesCount: response.data.likesCount,
                        };
                    }
                    return post;
                }));
                return response.data;
            }
        } catch (error) {
            console.error('Toggle like error:', error);
            toast.error('Failed to update like');
        }
    }, []);

    // ============ ADD COMMENT ============
    const addComment = useCallback(async (postId, text) => {
        try {
            const response = await feedService.addComment(postId, text);
            if (response.success) {
                setPosts(prev => prev.map(post => {
                    if (post._id === postId) {
                        return {
                            ...post,
                            comments: [...(post.comments || []), response.data],
                            commentsCount: (post.commentsCount || 0) + 1,
                        };
                    }
                    return post;
                }));
                return response.data;
            }
        } catch (error) {
            console.error('Add comment error:', error);
            toast.error('Failed to add comment');
        }
    }, []);

    // ============ DELETE COMMENT ============
    const deleteComment = useCallback(async (postId, commentId) => {
        try {
            const response = await feedService.deleteComment(postId, commentId);
            if (response.success) {
                setPosts(prev => prev.map(post => {
                    if (post._id === postId) {
                        const updatedComments = post.comments?.filter(c => c._id !== commentId) || [];
                        return {
                            ...post,
                            comments: updatedComments,
                            commentsCount: updatedComments.length,
                        };
                    }
                    return post;
                }));
                toast.success('Comment deleted');
                return true;
            }
        } catch (error) {
            console.error('Delete comment error:', error);
            toast.error('Failed to delete comment');
        }
    }, []);

    // ============ DELETE POST ============
    const deletePost = useCallback(async (postId) => {
        try {
            const response = await feedService.deletePost(postId);
            if (response.success) {
                setPosts(prev => prev.filter(post => post._id !== postId));
                setTrending(prev => prev.filter(post => post._id !== postId));
                toast.success('Post deleted');
                return true;
            }
        } catch (error) {
            console.error('Delete post error:', error);
            toast.error('Failed to delete post');
        }
    }, []);

    // ============ REFRESH FEED ============
    const refreshFeed = useCallback(async () => {
        setRefreshing(true);
        await loadFeed(true);
        setRefreshing(false);
    }, [loadFeed]);

    // ============ LOAD MORE ============
    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            loadFeed(false);
        }
    }, [loading, hasMore, loadFeed]);

    const value = {
        posts,
        trending,
        loading,
        refreshing,
        hasMore,
        loadFeed,
        loadTrending,
        createPost,
        toggleLike,
        addComment,
        deleteComment,
        deletePost,
        refreshFeed,
        loadMore,
    };

    return (
        <FeedContext.Provider value={value}>
            {children}
        </FeedContext.Provider>
    );
};

export const useFeed = () => {
    const context = useContext(FeedContext);
    if (!context) {
        throw new Error('useFeed must be used within a FeedProvider');
    }
    return context;
};

export default FeedContext;
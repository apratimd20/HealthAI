// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { healthService } from '../services/healthService';
import { userService } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [hasActiveGoal, setHasActiveGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    
    // ✅ Track if authentication is confirmed
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // ============ FETCH USER PROFILE ============
    const fetchUserProfile = useCallback(async () => {
        try {
            const response = await userService.getProfile();
            if (response.success) {
                const userData = response.data;
                setUser(userData);
                setIsAdmin(userData?.role === 'admin');
                setIsAuthenticated(true); // ✅ Set authenticated
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
                setIsAdmin(false);
                setIsAuthenticated(false);
            }
            return false;
        }
    }, []);

    // ============ CHECK ACTIVE GOAL ============
    const checkGoalStatus = useCallback(async () => {
        try {
            const response = await healthService.getActiveGoal();
            if (response.success && response.data) {
                setHasActiveGoal(true);
                return true;
            } else {
                setHasActiveGoal(false);
                return false;
            }
        } catch (error) {
            if (error.response?.status === 404) {
                setHasActiveGoal(false);
            } else {
                setHasActiveGoal(false);
            }
            return false;
        }
    }, []);

    // ============ INITIALIZE AUTH ============
    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
            
            const storedToken = localStorage.getItem('token');
            
            if (storedToken) {
                setToken(storedToken);
                const userFetched = await fetchUserProfile();
                
                if (userFetched) {
                    await checkGoalStatus();
                } else {
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                    setIsAdmin(false);
                    setIsAuthenticated(false);
                    setHasActiveGoal(false);
                }
            } else {
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
                setHasActiveGoal(false);
            }
            
            setLoading(false);
        };

        initializeAuth();
    }, []);

    // ============ LOGIN ============
    const login = useCallback(async (newToken) => {
        setLoading(true);
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        const userFetched = await fetchUserProfile();
        if (userFetched) {
            await checkGoalStatus();
            setIsAuthenticated(true);
        }
        
        setLoading(false);
    }, [fetchUserProfile, checkGoalStatus]);

    // ============ LOGOUT ============
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAdmin(false);
        setIsAuthenticated(false);
        setHasActiveGoal(false);
    }, []);

    // ============ UPDATE GOAL STATUS ============
    const updateGoalStatus = useCallback((status) => {
        setHasActiveGoal(status);
    }, []);

    // ============ REFRESH USER DATA ============
    const refreshUser = useCallback(async () => {
        setLoading(true);
        await fetchUserProfile();
        await checkGoalStatus();
        setLoading(false);
    }, [fetchUserProfile, checkGoalStatus]);

    // ============ CONTEXT VALUE ============
    const value = {
        user,
        token,
        isAuthenticated, 
        hasActiveGoal,
        isAdmin,
        loading,
        login,
        logout,
        updateGoalStatus,
        checkGoalStatus,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
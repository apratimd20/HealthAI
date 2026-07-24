// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { healthService } from '../services/healthService';
import { userService } from '../services/userService';

const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [hasActiveGoal, setHasActiveGoal] = useState(null); // null means not checked yet
    const [loading, setLoading] = useState(true);

    const checkGoalStatus = async () => {
        try {
            const response = await healthService.getActiveGoal();
            if (response.success && response.data) {
                setHasActiveGoal(true);
            } else {
                setHasActiveGoal(false);
            }
        } catch (error) {
            // If 404 or other error, goal is not active or token expired
            if (error.response && error.response.status === 404) {
                setHasActiveGoal(false);
            } else {
                setHasActiveGoal(false);
            }
        }
    };

    const fetchUserProfile = async () => {
    try {
        const response = await userService.getProfile();

        if (response.success) {
            setUser(response.data);
        }
    } catch (error) {
        console.error(error);
    }
};


    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                setToken(storedToken);
                // Determine user details from somewhere or fetch active goal (this also acts as active session check)
                await checkGoalStatus();
            } else {
                setToken(null);
                setHasActiveGoal(false);
            }
            setLoading(false);
        };

        initializeAuth();
    }, [token]);

    const login = async (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setLoading(true);
        await fetchUserProfile();
        await checkGoalStatus();
        setLoading(false);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setHasActiveGoal(false);
        setUser(null);
    };

    const updateGoalStatus = (status) => {
        setHasActiveGoal(status);
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                 user,
                isAuthenticated: !!token,
                hasActiveGoal,
                loading,
                login,
                logout,
                updateGoalStatus,
                checkGoalStatus,
            }}
        >
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

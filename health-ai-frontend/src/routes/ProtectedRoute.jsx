import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/ui/Loader';

const RouteLoadingState = ({ label = 'Preparing your workspace...' }) => (
  <div className="flex min-h-screen items-center justify-center bg-surface-base px-4">
    <div className="rounded-2xl border border-border-default bg-surface-card/80 px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <Loader size="md" text={label} />
    </div>
  </div>
);

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <RouteLoadingState label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <RouteLoadingState label="Preparing the app..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <RouteLoadingState label="Loading admin tools..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
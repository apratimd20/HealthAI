import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/ui/Loader';

const RouteLoadingState = ({ label = 'Preparing your workspace...' }) => (
  <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-2xl shadow-black/20">
      <div className="flex flex-col items-center gap-4">
        <Loader size="md" text={label} />
        <p className="text-sm text-zinc-400">{label}</p>
      </div>
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
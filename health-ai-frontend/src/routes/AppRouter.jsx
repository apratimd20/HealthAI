// routes/AppRouter.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, AdminRoute } from './ProtectedRoute';
import Loader from '../components/ui/Loader';

const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Feed = lazy(() => import('../pages/Feed'));
const AdminPanel = lazy(() => import('../pages/AdminPanel'));

const routeFallback = (
  <div className="flex min-h-screen items-center justify-center bg-surface-base px-4">
    <div className="rounded-2xl border border-border-default bg-surface-card/80 px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <Loader size="md" text="Opening Health AI" />
    </div>
  </div>
);

export default function AppRouter() {
  return (
    <Suspense fallback={routeFallback}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />

        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />

        <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

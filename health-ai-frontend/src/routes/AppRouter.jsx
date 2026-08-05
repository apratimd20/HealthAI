// routes/AppRouter.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, AdminRoute } from './ProtectedRoute';
import Loader from '../components/ui/Loader';

const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Feed = lazy(() => import('../pages/Feed'));
const TalkWithDoctorPage = lazy(() => import('../pages/TalkWithDoctor/TalkWithDoctorPage'));
const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminCommunity = lazy(() => import('../pages/admin/AdminCommunity'));
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminConversationDetail = lazy(() => import('../pages/admin/AdminConversationDetail'));
const AdminReports = lazy(() => import('../pages/admin/AdminReports'));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));

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
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="community" element={<AdminCommunity />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="analytics/:id" element={<AdminConversationDetail />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor"
          element={
            <ProtectedRoute>
              <TalkWithDoctorPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

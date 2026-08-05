// src/pages/admin/AdminLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  IoGridOutline,
  IoPeopleOutline,
  IoChatbubblesOutline,
  IoAnalyticsOutline,
  IoDocumentTextOutline,
  IoSettingsOutline,
  IoMenuOutline,
  IoCloseOutline,
  IoChevronForwardOutline,
  IoLogOutOutline,
  IoHomeOutline,
  IoFitnessOutline,
} from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: <IoGridOutline size={20} />, end: true },
  { path: '/admin/users', label: 'User Management', icon: <IoPeopleOutline size={20} /> },
  { path: '/admin/community', label: 'Community Management', icon: <IoChatbubblesOutline size={20} /> },
  { path: '/admin/analytics', label: 'Chat Analytics', icon: <IoAnalyticsOutline size={20} /> },
  { path: '/admin/reports', label: 'Reports', icon: <IoDocumentTextOutline size={20} /> },
  { path: '/admin/settings', label: 'Settings', icon: <IoSettingsOutline size={20} /> },
];

const CRUMB_MAP = [
  { match: /^\/admin\/users\/[\w-]+$/, crumbs: ['User Management', 'User Detail'] },
  { match: /^\/admin\/users$/, crumbs: ['User Management'] },
  { match: /^\/admin\/community$/, crumbs: ['Community Management'] },
  { match: /^\/admin\/analytics\/[\w-]+$/, crumbs: ['Chat Analytics', 'Conversation'] },
  { match: /^\/admin\/analytics$/, crumbs: ['Chat Analytics'] },
  { match: /^\/admin\/reports$/, crumbs: ['Reports'] },
  { match: /^\/admin\/settings$/, crumbs: ['Settings'] },
];

const SidebarContent = ({ onNavigate }) => {
  const { user } = useAuth();
  const location = useLocation();
  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-border-default px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-slate-950">
          <IoFitnessOutline size={20} />
        </div>
        <div>
          <p className="text-sm font-extrabold tracking-tight text-fg">Health AI</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-fg-subtle">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand/15 text-brand'
                  : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
                )}
                <span className={isActive ? 'text-brand' : 'text-fg-muted group-hover:text-fg'}>
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border-default p-3">
        <div className="flex items-center gap-3 rounded-xl bg-surface-muted p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-slate-950">
            {initials || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">{user?.name}</p>
            <p className="truncate text-xs text-fg-muted">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const crumbs =
    CRUMB_MAP.find((entry) => entry.match.test(location.pathname))?.crumbs || ['Dashboard'];

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-base text-fg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border-default bg-surface-muted/60 backdrop-blur lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-y-0 left-0 w-72 border-r border-border-default bg-surface-card shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="absolute right-3 top-4 rounded-md p-1.5 text-fg-muted hover:bg-surface-muted hover:text-fg"
                aria-label="Close menu"
              >
                <IoCloseOutline size={20} />
              </button>
              <SidebarContent onNavigate={() => setSidebarOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border-default bg-surface-base/90 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-fg-muted transition hover:bg-surface-muted hover:text-fg lg:hidden"
            aria-label="Open menu"
          >
            <IoMenuOutline size={22} />
          </button>

          {/* Breadcrumb */}
          <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
            <NavLink to="/dashboard" className="flex items-center gap-1 text-fg-muted transition hover:text-fg">
              <IoHomeOutline size={14} />
              <span className="hidden sm:inline">App</span>
            </NavLink>
            {crumbs.map((crumb, index) => (
              <React.Fragment key={crumb}>
                <IoChevronForwardOutline size={13} className="shrink-0 text-fg-subtle" />
                <span
                  className={`truncate ${
                    index === crumbs.length - 1 ? 'font-semibold text-fg' : 'text-fg-muted'
                  }`}
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full border border-border-default bg-surface-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted md:inline-block">
              Admin
            </span>

            {/* Profile menu */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-slate-950 transition hover:scale-105"
                title={user?.name || 'Profile'}
              >
                {initials || 'A'}
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-border-default bg-surface-card shadow-2xl"
                  >
                    <div className="border-b border-border-default p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-slate-950">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-fg">{user?.name}</p>
                          <p className="truncate text-xs text-fg-muted">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-fg-muted transition hover:bg-surface-muted hover:text-fg"
                    >
                      <IoGridOutline size={17} />
                      Back to app
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                    >
                      <IoLogOutOutline size={17} />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-border-default px-6 py-4 text-center text-xs text-fg-subtle">
          Health AI Admin Panel · Built for operational monitoring
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
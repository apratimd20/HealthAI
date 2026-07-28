// layouts/DashboardLayout.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { NavLink, useLocation } from "react-router-dom";
import {
  IoFitnessOutline,
  IoLogOutOutline,
  IoPersonCircleOutline,
  IoHomeOutline,
  IoRestaurantOutline,
  IoChatbubbleEllipsesOutline,
  IoCameraOutline,
  IoCalendarOutline,
  IoBarChartOutline,
  IoPeopleOutline,
} from "react-icons/io5";

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const initials = user?.name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navigation items
  const navItems = [
    { 
      path: "/dashboard", 
      icon: <IoHomeOutline size={20} />, 
      label: "Dashboard" 
    },
    { 
      path: "/feed", 
      icon: <IoPeopleOutline size={20} />, 
      label: "Health Community" 
    },
    // { 
    //   path: "/scan", 
    //   icon: <IoCameraOutline size={20} />, 
    //   label: "Food Scanner" 
    // },
    // { 
    //   path: "/chat", 
    //   icon: <IoChatbubbleEllipsesOutline size={20} />, 
    //   label: "AI Chat" 
    // },
    // { 
    //   path: "/progress", 
    //   icon: <IoBarChartOutline size={20} />, 
    //   label: "Progress" 
    // },
    // { 
    //   path: "/calendar", 
    //   icon: <IoCalendarOutline size={20} />, 
    //   label: "Calendar" 
    // },
  ];

  return (
    <div className="min-h-svh bg-surface-base">
      <header className="glass-panel sticky top-0 z-40 border-b border-white/5">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/15 text-brand">
              <IoFitnessOutline className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-fg">
              Health AI
            </span>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white font-semibold shadow-lg transition hover:scale-105"
            >
              {initials || <IoPersonCircleOutline size={22} />}
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-xl border border-white/10 bg-surface-card shadow-2xl">
                <div className="border-b border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white text-lg font-bold">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-fg">{user?.name}</h3>
                      <p className="text-sm text-fg-muted">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                >
                  <IoLogOutOutline size={20} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="sticky top-18 z-30 border-b border-white/5 bg-surface-base/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-brand/20 text-brand shadow-sm"
                      : "text-fg-muted hover:bg-surface-muted hover:text-fg"
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
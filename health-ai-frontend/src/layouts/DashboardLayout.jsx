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

import NotificationToggle from "../components/ui/NotificationToggle";
import InstallPwaButton from "../components/ui/InstallPwaButton";

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
  ];

  return (
    <div className="min-h-svh bg-surface-base">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-surface-base/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
              <IoFitnessOutline className="h-5 w-5" />
            </div>
            <span className="truncate text-base font-extrabold tracking-tight text-fg sm:text-lg">
              Health AI
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="scale-[0.82] sm:scale-100">
              <InstallPwaButton />
            </div>

            <div className="scale-[0.92] sm:scale-100">
              <NotificationToggle />
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-md transition hover:scale-105 sm:h-10 sm:w-10 sm:text-base"
                title={user?.name || "User profile"}
              >
                {initials || <IoPersonCircleOutline size={22} />}
              </button>

              {open && (
                <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/10 bg-surface-card shadow-2xl z-50">
                  <div className="border-b border-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white font-bold">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-fg text-sm sm:text-base">{user?.name}</h3>
                        <p className="truncate text-xs text-fg-muted">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    <IoLogOutOutline size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="sticky top-16  sm:top-18 z-30 border-b border-white/5 bg-surface-base/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-3 sm:px-6">
          <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all whitespace-nowrap sm:px-4 sm:text-sm ${
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

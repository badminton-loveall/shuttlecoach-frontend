import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminLayout.css';

/**
 * AdminLayout Component
 * Sidebar-based layout for ADMIN users wrapping all /admin/* routes.
 * Provides sidebar navigation (Dashboard, Centers, Settings),
 * a top header with user info and logout, and a main content area with <Outlet />.
 */

interface AdminNavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: AdminNavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Centers',
    path: '/admin/centers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = user?.name ? getInitials(user.name) : 'A';

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-layout__sidebar ${isSidebarCollapsed ? 'admin-layout__sidebar--collapsed' : ''}`}>
        {/* Brand */}
        <div className="admin-layout__brand">
          <span className="admin-layout__brand-logo">LoveAll</span>
          {!isSidebarCollapsed && <span className="admin-layout__brand-badge">Admin</span>}
        </div>

        {/* Navigation */}
        <nav className="admin-layout__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `admin-layout__nav-link ${isActive ? 'admin-layout__nav-link--active' : ''}`
              }
              title={item.label}
            >
              <span className="admin-layout__nav-icon">{item.icon}</span>
              {!isSidebarCollapsed && <span className="admin-layout__nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          className="admin-layout__collapse-btn"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isSidebarCollapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </aside>

      {/* Main area */}
      <div className="admin-layout__main">
        {/* Header / Topbar */}
        <header className="admin-layout__header">
          <div className="admin-layout__header-left">
            <h1 className="admin-layout__header-title">Admin Panel</h1>
          </div>
          <div className="admin-layout__header-right">
            <div className="admin-layout__user-info">
              <div className="admin-layout__user-avatar">{initials}</div>
              <span className="admin-layout__user-name">{user?.name || 'Admin'}</span>
            </div>
            <button className="admin-layout__logout-btn" onClick={handleSignOut} title="Sign out">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="admin-layout__logout-text">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="admin-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';
import logoImg from '../assets/logo.png';
import './AdminLayout.css';

/**
 * AdminLayout Component
 * Sidebar-based layout for ADMIN users wrapping all /admin/* routes.
 * Provides sidebar navigation with sign-out pinned to the bottom, a top
 * header with user info, and a main content area with <Outlet />.
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
    label: 'Marketplace',
    path: '/admin/marketplace',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    label: 'Subscriptions',
    path: '/admin/subscription-catalog',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Accounting',
    path: '/admin/accounting',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [slugRequestCount, setSlugRequestCount] = useState(0);
  const showLabels = !isSidebarCollapsed || isMobileMenuOpen;

  useEffect(() => {
    document.body.classList.toggle('body-scroll-locked', isMobileMenuOpen);
    return () => document.body.classList.remove('body-scroll-locked');
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const fetchSlugRequestCount = async () => {
      try {
        const response = await apiClient.get('/admin/slug-change-requests/count');
        setSlugRequestCount(response.data.count || 0);
      } catch {
        // Silently fail — badge just won't show
      }
    };

    fetchSlugRequestCount();
    // Refresh count every 60 seconds
    const interval = setInterval(fetchSlugRequestCount, 60000);
    return () => clearInterval(interval);
  }, []);

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
      {/* Backdrop — mobile only, closes the drawer on tap */}
      <div
        className={`admin-layout__backdrop ${isMobileMenuOpen ? 'admin-layout__backdrop--visible' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`admin-layout__sidebar ${isSidebarCollapsed ? 'admin-layout__sidebar--collapsed' : ''} ${isMobileMenuOpen ? 'admin-layout__sidebar--mobile-open' : ''}`}
      >
        {/* Brand */}
        <div className="admin-layout__brand">
          <img src={logoImg} alt="LoveAll logo" className="admin-layout__brand-logo" />

          {/* Collapse toggle — desktop only, hidden on mobile via CSS */}
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
        </div>

        {/* Navigation */}
        <nav className="admin-layout__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `admin-layout__nav-link ${isActive ? 'admin-layout__nav-link--active' : ''}`
              }
              title={item.label}
            >
              <span className="admin-layout__nav-icon">{item.icon}</span>
              {showLabels && <span className="admin-layout__nav-label">{item.label}</span>}
              {item.path === '/admin/slug-requests' && slugRequestCount > 0 && (
                <span className="admin-layout__nav-badge">{slugRequestCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="admin-layout__sidebar-footer">
          <button
            className="admin-layout__signout-link"
            onClick={handleSignOut}
            title="Sign out"
          >
            <span className="admin-layout__nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            {showLabels && <span className="admin-layout__nav-label">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="admin-layout__main">
        {/* Header / Topbar */}
        <header className="admin-layout__header">
          <div className="admin-layout__header-left">
            <button
              className="admin-layout__hamburger-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
            <h1 className="admin-layout__header-title">Admin Panel</h1>
          </div>
          <div className="admin-layout__header-right">
            <div className="admin-layout__user-info">
              <div className="admin-layout__user-avatar">{initials}</div>
              <span className="admin-layout__user-name">{user?.name || 'Admin'}</span>
            </div>
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

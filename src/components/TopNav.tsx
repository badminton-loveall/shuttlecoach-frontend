import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import './TopNav.css';

/**
 * TopNav Component
 * Displays application header with role-aware navigation, user profile, and sign-out
 * Uses pure CSS with design tokens and BEM methodology
 */

interface NavLink {
  label: string;
  path: string;
  roles: UserRole[];
}

const NAV_LINKS: NavLink[] = [
  { label: 'Dashboard', path: '/dashboard', roles: ['HEAD_COACH', 'ASSISTANT_COACH'] },
  { label: 'Students', path: '/students', roles: ['HEAD_COACH', 'ASSISTANT_COACH'] },
  { label: 'Fees', path: '/fees', roles: ['HEAD_COACH', 'ASSISTANT_COACH'] },
  { label: 'Coaches', path: '/coaches', roles: ['HEAD_COACH'] },
  { label: 'Curriculum', path: '/curriculum', roles: ['HEAD_COACH', 'ASSISTANT_COACH'] },
  // Student role
  { label: 'Dashboard', path: '/student-dashboard', roles: ['STUDENT'] },
  { label: 'My Progress', path: '/my-progress', roles: ['STUDENT'] },
  { label: 'My Fees', path: '/my-fees', roles: ['STUDENT'] },
];

export const TopNav: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter nav links for current user role
  const visibleLinks = NAV_LINKS.filter((link) => link.roles.includes(role || ('STUDENT' as UserRole)));

  // Handle sign out
  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  // Generate user initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = user?.name ? getInitials(user.name) : 'U';

  return (
    <nav className="topnav">
      <div className="topnav__container">
        {/* Logo / Brand */}
        <Link to="/" className="topnav__logo">
          <span className="topnav__logo-text">LoveAll</span>
        </Link>

        {/* Navigation Links - Desktop */}
        <div className="topnav__links-desktop">
          {visibleLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`topnav__link ${location.pathname === link.path ? 'topnav__link--active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: User Profile & Sign Out */}
        <div className="topnav__right">
          {/* User Info */}
          <div className="topnav__user-info">
            <div className="topnav__user-avatar">{initials}</div>
            <div className="topnav__user-details">
              <div className="topnav__user-name">{user?.name || 'User'}</div>
              <div className="topnav__user-role">{role?.replace('_', ' ') || 'Guest'}</div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button className="btn-base btn-ghost btn-icon-only topnav__btn-signout" onClick={handleSignOut} title="Sign out">
            <svg
              className="topnav__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="btn-base btn-ghost btn-icon-only topnav__btn-mobile"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Toggle menu"
          >
            <svg className="topnav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Links - Mobile */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay backdrop */}
          <div 
            className="topnav__overlay" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Side drawer menu */}
          <div className="topnav__drawer">
            {visibleLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`topnav__drawer-link ${location.pathname === link.path ? 'topnav__drawer-link--active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button className="topnav__drawer-link topnav__drawer-signout" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </>
      )}
    </nav>
  );
};

export default TopNav;

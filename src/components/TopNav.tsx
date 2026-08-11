import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CenterSwitcher from './CenterSwitcher';
import './TopNav.css';

/**
 * TopNav Component
 * Role-aware navigation with dropdown menus, profile avatar dropdown,
 * and mobile drawer. Uses pure CSS with design tokens and BEM methodology.
 */

// --- Types ---

interface NavItem {
  label: string;
  path: string;
}

interface NavDropdown {
  label: string;
  items: NavItem[];
}

type NavEntry = NavItem | NavDropdown;

function isDropdown(entry: NavEntry): entry is NavDropdown {
  return 'items' in entry;
}

// --- Navigation config by role ---

const COACH_NAV: NavEntry[] = [
  { label: 'Dashboard', path: '/dashboard' },
  {
    label: 'People',
    items: [
      { label: 'Students', path: '/students' },
      // Coaches sub-item is added dynamically for HEAD_COACH
    ],
  },
  {
    label: 'Training',
    items: [
      { label: 'Calendar', path: '/calendar' },
      { label: 'Attendance', path: '/attendance' },
      { label: 'Curriculum', path: '/curriculum' },
      { label: 'Batches', path: '/batches' },
      { label: 'Drills', path: '/drills' },
      { label: 'Analytics', path: '/training-analytics' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Fees', path: '/fees' },
      { label: 'Accounts', path: '/ledger' },
    ],
  },
];

const STUDENT_NAV: NavEntry[] = [
  { label: 'Dashboard', path: '/student-dashboard' },
  {
    label: 'Training',
    items: [
      { label: 'Calendar', path: '/calendar' },
      { label: 'My Progress', path: '/my-progress' },
    ],
  },
  { label: 'My Fees', path: '/my-fees' },
];

// --- Component ---

export const TopNav: React.FC = () => {
  const { user, activeRole, canAccessFees, logout } = useAuth();
  // Use activeRole for center-aware navigation visibility (Requirements: 3.2)
  const role = activeRole;
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const profileRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns on route change
  useEffect(() => {
    setOpenDropdown(null);
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Click-outside listener for dropdowns and profile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Close nav dropdowns
      if (openDropdown) {
        const ref = dropdownRefs.current[openDropdown];
        if (ref && !ref.contains(target)) {
          setOpenDropdown(null);
        }
      }

      // Close profile dropdown
      if (isProfileOpen && profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown, isProfileOpen]);

  // Build nav items based on role
  const getNavItems = (): NavEntry[] => {
    if (role === 'STUDENT') {
      return STUDENT_NAV;
    }

    // Coach roles
    return COACH_NAV.map((entry) => {
      if (isDropdown(entry) && entry.label === 'People') {
        let items = [...entry.items];
        // Add Coaches sub-item for HEAD_COACH
        if (role === 'HEAD_COACH') {
          items = [...items, { label: 'Coaches', path: '/coaches' }];
        }
        return { ...entry, items };
      }

      if (isDropdown(entry) && entry.label === 'Training') {
        let items = [...entry.items];
        // Leave Requests only for HEAD_COACH (center admin privilege)
        if (role === 'HEAD_COACH') {
          items = [...items.slice(0, 2), { label: 'Leave Requests', path: '/leave-requests' }, ...items.slice(2)];
        }
        return { ...entry, items };
      }

      if (isDropdown(entry) && entry.label === 'Finance') {
        // Filter finance links based on canAccessFees permission
        let items = canAccessFees
          ? entry.items
          : entry.items.filter((item) => item.path !== '/fees' && item.path !== '/ledger');

        // If no items remain after filtering, exclude the dropdown entirely
        if (items.length === 0) {
          return null;
        }

        return { ...entry, items };
      }
      return entry;
    }).filter((entry): entry is NavEntry => entry !== null);
  };

  const navItems = getNavItems();

  // Flatten all nav items for the mobile drawer
  const getMobileLinks = (): { label: string; path: string; isSubItem?: boolean; parentLabel?: string }[] => {
    const links: { label: string; path: string; isSubItem?: boolean; parentLabel?: string }[] = [];
    for (const entry of navItems) {
      if (isDropdown(entry)) {
        for (const item of entry.items) {
          links.push({ label: item.label, path: item.path, isSubItem: true, parentLabel: entry.label });
        }
      } else {
        links.push({ label: entry.label, path: entry.path });
      }
    }
    return links;
  };

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

  const initials = user?.name ? getInitials(user.name) : 'U';

  const toggleDropdown = (label: string) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  const isPathActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const isDropdownActive = (entry: NavDropdown): boolean => {
    return entry.items.some((item) => location.pathname === item.path);
  };

  return (
    <nav className="topnav">
      <div className="topnav__container">
        {/* Logo / Brand */}
        <Link to="/" className="topnav__logo">
          <span className="topnav__logo-text">LoveAll</span>
        </Link>

        {/* Navigation Links - Desktop */}
        <div className="topnav__links-desktop">
          {navItems.map((entry) => {
            if (isDropdown(entry)) {
              const active = isDropdownActive(entry);
              return (
                <div
                  key={entry.label}
                  className="topnav__dropdown"
                  ref={(el) => { dropdownRefs.current[entry.label] = el; }}
                >
                  <button
                    className={`topnav__link topnav__link--dropdown ${active ? 'topnav__link--active' : ''}`}
                    onClick={() => toggleDropdown(entry.label)}
                    aria-expanded={openDropdown === entry.label}
                    aria-haspopup="true"
                  >
                    {entry.label}
                    <svg
                      className={`topnav__chevron ${openDropdown === entry.label ? 'topnav__chevron--open' : ''}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {openDropdown === entry.label && (
                    <div className="topnav__dropdown-panel">
                      {entry.items.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`topnav__dropdown-item ${isPathActive(item.path) ? 'topnav__dropdown-item--active' : ''}`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Standalone link
            return (
              <Link
                key={entry.path}
                to={entry.path}
                className={`topnav__link ${isPathActive(entry.path) ? 'topnav__link--active' : ''}`}
              >
                {entry.label}
              </Link>
            );
          })}
        </div>

        {/* Right side: Center Switcher, Profile Avatar & Mobile Toggle */}
        <div className="topnav__right">
          {/* Center Switcher — only for non-ADMIN authenticated users (Requirement 2.1) */}
          {role && role !== 'ADMIN' && <CenterSwitcher />}

          {/* Profile Avatar */}
          <div className="topnav__profile" ref={profileRef}>
            <button
              className="topnav__avatar-btn"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              title="Profile menu"
            >
              <div className="topnav__user-avatar">{initials}</div>
            </button>

            {isProfileOpen && (
              <div className="topnav__profile-dropdown">
                <div className="topnav__profile-header">
                  <span className="topnav__profile-name">{user?.name || 'User'}</span>
                  <span className="topnav__profile-role">{role?.replace('_', ' ') || 'Guest'}</span>
                </div>
                <div className="topnav__profile-divider" />
                <Link to="/profile" className="topnav__profile-item">
                  My Profile
                </Link>
                {role === 'HEAD_COACH' && (
                  <Link to="/master-data" className="topnav__profile-item">
                    Settings
                  </Link>
                )}
                <Link to="/help" className="topnav__profile-item">
                  Help
                </Link>
                <div className="topnav__profile-divider" />
                <button className="topnav__profile-item topnav__profile-item--danger" onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="btn-base btn-ghost btn-icon-only topnav__btn-mobile"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Toggle menu"
          >
            <svg
              className="topnav__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <>
          <div className="topnav__overlay" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="topnav__drawer">
            {/* User info at top of drawer */}
            <div className="topnav__drawer-user">
              <div className="topnav__user-avatar">{initials}</div>
              <div className="topnav__drawer-user-info">
                <span className="topnav__drawer-user-name">{user?.name || 'User'}</span>
                <span className="topnav__drawer-user-role">{role?.replace('_', ' ') || 'Guest'}</span>
              </div>
            </div>
            <div className="topnav__drawer-divider" />

            {/* Flat list of all links (no nested dropdowns on mobile) */}
            {getMobileLinks().map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`topnav__drawer-link ${isPathActive(link.path) ? 'topnav__drawer-link--active' : ''} ${link.isSubItem ? 'topnav__drawer-link--sub' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Settings link in drawer for coaches */}
            {(role === 'HEAD_COACH' || role === 'ASSISTANT_COACH') && (
              <>
                <div className="topnav__drawer-divider" />
                <Link
                  to="/master-data"
                  className={`topnav__drawer-link ${isPathActive('/master-data') ? 'topnav__drawer-link--active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>
              </>
            )}

            {/* Sign out */}
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

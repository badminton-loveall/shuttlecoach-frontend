import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './BottomNav.css';

/**
 * BottomNav Component
 * Mobile-only bottom tab bar (hidden on desktop via CSS) — the primary,
 * thumb-reachable destinations for the signed-in role. Everything else
 * stays reachable through the existing hamburger drawer in TopNav.
 *
 * Item choice is role-specific, based on what each role actually needs day
 * to day: a coach wants today's batches, their students, attendance, and
 * drills; a head coach additionally oversees junior coaches; a student wants
 * their upcoming sessions, progress, and fees.
 */

interface BottomNavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const icon = (paths: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

const ICONS = {
  dashboard: icon(<><path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v10h14V10" /></>),
  students: icon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  coaches: icon(<><circle cx="9" cy="8" r="4" /><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" /><path d="M18 8a3 3 0 1 1 0-6" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>),
  attendance: icon(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 16 2 2 4-4" /></>),
  drills: icon(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.5" /></>),
  calendar: icon(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>),
  progress: icon(<><path d="M3 3v18h18" /><path d="M7 15l4-6 3 3 5-8" /></>),
  fees: icon(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>),
};

function getBottomNavItems(role: string | null): BottomNavItem[] {
  if (role === 'HEAD_COACH') {
    return [
      { label: 'Dashboard', path: '/dashboard', icon: ICONS.dashboard },
      { label: 'Students', path: '/students', icon: ICONS.students },
      { label: 'Attendance', path: '/attendance', icon: ICONS.attendance },
      { label: 'Coaches', path: '/coaches', icon: ICONS.coaches },
    ];
  }
  if (role === 'ASSISTANT_COACH') {
    return [
      { label: 'Dashboard', path: '/dashboard', icon: ICONS.dashboard },
      { label: 'Students', path: '/students', icon: ICONS.students },
      { label: 'Attendance', path: '/attendance', icon: ICONS.attendance },
      { label: 'Drills', path: '/drills', icon: ICONS.drills },
    ];
  }
  if (role === 'STUDENT') {
    return [
      { label: 'Dashboard', path: '/student-dashboard', icon: ICONS.dashboard },
      { label: 'Calendar', path: '/calendar', icon: ICONS.calendar },
      { label: 'Progress', path: '/my-progress', icon: ICONS.progress },
      { label: 'Fees', path: '/my-fees', icon: ICONS.fees },
    ];
  }
  return [];
}

export const BottomNav: React.FC = () => {
  const { activeRole } = useAuth();
  const location = useLocation();

  const items = getBottomNavItems(activeRole);
  if (items.length === 0) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`bottom-nav__item ${isActive(item.path) ? 'bottom-nav__item--active' : ''}`}
        >
          <span className="bottom-nav__icon" aria-hidden="true">{item.icon}</span>
          <span className="bottom-nav__label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;

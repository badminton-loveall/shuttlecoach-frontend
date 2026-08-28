import React from 'react';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import { useAuth } from '../contexts/AuthContext';
import './DashboardLayout.css';

/**
 * DashboardLayout Component
 * Wraps all authenticated pages with TopNav and consistent padding/spacing
 * Provides consistent layout structure for all dashboard pages
 *
 * Uses activeCenterId as a key on the content area so that switching centers
 * forces a full remount of child components, triggering fresh data fetches.
 */

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, className = '' }) => {
  const { activeCenterId } = useAuth();

  return (
    <div className="dashboard-layout">
      <TopNav />
      <main key={activeCenterId || 'no-center'} className={`dashboard-content ${className}`}>{children}</main>
      <BottomNav />
    </div>
  );
};

export default DashboardLayout;

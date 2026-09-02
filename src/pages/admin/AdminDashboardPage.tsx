import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import './AdminDashboardPage.css';

/**
 * AdminDashboardPage
 * Displays aggregate statistics across all centers and per-center summary cards.
 * Fetches data from GET /api/admin/dashboard.
 *
 * Requirements: 7.1, 7.2, 7.3
 */

interface DashboardTotals {
  activeCenters: number;
  totalStudents: number;
  totalCoaches: number;
  totalRevenue: number;
  marketplacePacks: number;
  pendingReviews: number;
}

interface CenterSummary {
  id: string;
  name: string;
  studentCount: number;
  coachCount: number;
  monthlyRevenue: number;
}

interface DashboardData {
  totals: DashboardTotals;
  centers: CenterSummary[];
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<DashboardData>('/admin/dashboard');
        setData(response.data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, []);

  const handleCenterClick = (centerId: string) => {
    navigate(`/admin/centers/${centerId}`);
  };

  const formatRevenue = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__header admin-page-header">
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Platform overview and center statistics</p>
        </div>
        <div className="admin-dashboard__loading">
          <div className="admin-dashboard__loading-spinner" />
          <p className="admin-dashboard__loading-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__header admin-page-header">
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Platform overview and center statistics</p>
        </div>
        <div className="admin-dashboard__error">
          <svg className="admin-dashboard__error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="admin-dashboard__error-text">{error}</p>
          <button
            className="admin-dashboard__retry-btn"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="admin-dashboard">
      {/* Page header */}
      <div className="admin-dashboard__header admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Platform overview and center statistics</p>
      </div>

      {/* Aggregate stat cards */}
      <div className="admin-dashboard__stats-grid">
        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--centers">
          <div className="admin-dashboard__stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-value">{data.totals.activeCenters}</span>
            <span className="admin-dashboard__stat-label">Active Centers</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--students">
          <div className="admin-dashboard__stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-value">{data.totals.totalStudents}</span>
            <span className="admin-dashboard__stat-label">Total Students</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--coaches">
          <div className="admin-dashboard__stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-value">{data.totals.totalCoaches}</span>
            <span className="admin-dashboard__stat-label">Total Coaches</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card admin-dashboard__stat-card--revenue">
          <div className="admin-dashboard__stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-value">{formatRevenue(data.totals.totalRevenue)}</span>
            <span className="admin-dashboard__stat-label">Total Revenue</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/marketplace')}
          className="admin-dashboard__stat-card admin-dashboard__stat-card--marketplace admin-dashboard__stat-card--clickable"
          aria-label="Open Marketplace"
        >
          {data.totals.pendingReviews > 0 && (
            <span className="admin-dashboard__stat-pending-badge">{data.totals.pendingReviews}</span>
          )}
          <div className="admin-dashboard__stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-value">{data.totals.marketplacePacks}</span>
            <span className="admin-dashboard__stat-label">
              Marketplace Packs
              {data.totals.pendingReviews > 0 ? ` · ${data.totals.pendingReviews} pending` : ''}
            </span>
          </div>
        </button>
      </div>

      {/* Per-center summary */}
      <div className="admin-dashboard__centers-section">
        <h2 className="admin-dashboard__section-title">Centers Overview</h2>
        {data.centers.length === 0 ? (
          <p className="admin-dashboard__empty-text">No centers found.</p>
        ) : (
          <div className="admin-dashboard__centers-grid">
            {data.centers.map((center) => (
              <button
                key={center.id}
                className="admin-dashboard__center-card"
                onClick={() => handleCenterClick(center.id)}
                type="button"
                aria-label={`View details for ${center.name}`}
              >
                <div className="admin-dashboard__center-header">
                  <h3 className="admin-dashboard__center-name">{center.name}</h3>
                  <svg className="admin-dashboard__center-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
                <div className="admin-dashboard__center-stats">
                  <div className="admin-dashboard__center-stat">
                    <span className="admin-dashboard__center-stat-value">{center.studentCount}</span>
                    <span className="admin-dashboard__center-stat-label">Students</span>
                  </div>
                  <div className="admin-dashboard__center-stat">
                    <span className="admin-dashboard__center-stat-value">{center.coachCount}</span>
                    <span className="admin-dashboard__center-stat-label">Coaches</span>
                  </div>
                  <div className="admin-dashboard__center-stat">
                    <span className="admin-dashboard__center-stat-value">{formatRevenue(center.monthlyRevenue)}</span>
                    <span className="admin-dashboard__center-stat-label">Monthly Revenue</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;

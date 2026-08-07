import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import type { Center } from '../../types';
import './CentersListPage.css';

/**
 * CentersListPage
 * Lists all centers with status badges (active/inactive) and head coach assignment.
 * Includes a "Create Center" button and row click navigation to detail view.
 *
 * Requirements: 3.3, 9.3
 */

export const CentersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<Center[]>('/admin/centers');
        const data = Array.isArray(response.data) ? response.data : [];
        setCenters(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load centers';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchCenters();
  }, []);

  const handleCreateCenter = () => {
    navigate('/admin/centers/new');
  };

  const handleCenterClick = (centerId: string) => {
    navigate(`/admin/centers/${centerId}`);
  };

  return (
    <div className="centers-list-page">
      {/* Page Header */}
      <div className="centers-list-page__header">
        <div>
          <h1 className="centers-list-page__title">Centers</h1>
          <p className="centers-list-page__subtitle">
            Manage all coaching centers across the platform
          </p>
        </div>
        <button
          className="centers-list-page__create-btn"
          onClick={handleCreateCenter}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Center
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="centers-list-page__loading">
          <div className="centers-list-page__loading-spinner" />
          <p>Loading centers...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="centers-list-page__error">
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && centers.length === 0 && (
        <div className="centers-list-page__empty">
          <svg
            className="centers-list-page__empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <h2>No Centers Yet</h2>
          <p>Create your first coaching center to get started.</p>
          <button
            className="centers-list-page__create-btn"
            onClick={handleCreateCenter}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create Center
          </button>
        </div>
      )}

      {/* Centers Table */}
      {!loading && !error && centers.length > 0 && (
        <div className="centers-list-page__table-wrapper">
          <table className="centers-list-page__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Status</th>
                <th>Head Coach</th>
              </tr>
            </thead>
            <tbody>
              {centers.map((center) => (
                <tr
                  key={center.id}
                  className="centers-list-page__row"
                  onClick={() => handleCenterClick(center.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCenterClick(center.id);
                    }
                  }}
                >
                  <td className="centers-list-page__cell-name">
                    {center.name}
                  </td>
                  <td className="centers-list-page__cell-location">
                    {center.location || '—'}
                  </td>
                  <td>
                    <span
                      className={`centers-list-page__badge ${
                        center.isActive
                          ? 'centers-list-page__badge--active'
                          : 'centers-list-page__badge--inactive'
                      }`}
                    >
                      {center.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {center.headCoachId ? (
                      <span className="centers-list-page__coach-assigned">
                        Assigned
                      </span>
                    ) : (
                      <span className="centers-list-page__coach-unassigned">
                        Unassigned
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CentersListPage;

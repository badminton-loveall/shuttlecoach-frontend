import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';
import './BatchListPage.css';

/**
 * BatchListPage
 * Displays all batches in a table with role-based actions.
 * HEAD_COACH: Add Batch button + Edit links per row.
 * ASSISTANT_COACH: Read-only view.
 * Requirements: 1.1, 7.1, 7.2, 7.3
 */

interface BatchRecord {
  id: string;
  name: string;
  schedule: string | null;
  coach_name: string | null;
  coach_role: string | null;
  skill_level: string | null;
  student_count: number;
  days_of_week?: string[];
  start_time?: string;
  end_time?: string;
  template_name?: string | null;
}

const BatchListPage: React.FC = () => {
  const { activeRole } = useAuth();
  const navigate = useNavigate();

  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isHeadCoach = activeRole === 'HEAD_COACH';

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/batches');
      const batchData = response.data.batches || response.data;
      setBatches(Array.isArray(batchData) ? batchData : []);
    } catch {
      setError('Failed to load batches. Please try again.');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBatches();
  }, []);

  /** Build a human-readable schedule summary from batch data */
  const getScheduleInfo = (batch: BatchRecord): string => {
    if (batch.days_of_week && batch.days_of_week.length > 0 && batch.start_time) {
      const days = batch.days_of_week.join(', ');
      const time = batch.end_time
        ? `${batch.start_time}–${batch.end_time}`
        : batch.start_time;
      return `${days} ${time}`;
    }
    if (batch.schedule) {
      return batch.schedule;
    }
    if (batch.template_name) {
      return batch.template_name;
    }
    return '—';
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="batch-list__loading">Loading batches...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error && batches.length === 0) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="batch-list__error">
            <p>{error}</p>
            <button onClick={fetchBatches} className="btn btn-secondary batch-list__retry-btn">
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="batch-list">
          {/* Header */}
          <div className="batch-list__header">
            <h1 className="batch-list__title">Batches</h1>
            {isHeadCoach && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/batches/new')}
              >
                Add Batch
              </button>
            )}
          </div>

          {/* Content */}
          {batches.length === 0 ? (
            <div className="batch-list__empty">
              <p>No batches found.</p>
              {isHeadCoach && (
                <p>Click "Add Batch" to create your first batch.</p>
              )}
            </div>
          ) : (
            <div className="batch-list__table-wrap">
              <table className="batch-list__table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Schedule</th>
                    <th>Coach</th>
                    <th>Skill Level</th>
                    <th>Students</th>
                    {isHeadCoach && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr key={batch.id}>
                      <td className="batch-list__name">{batch.name}</td>
                      <td className="batch-list__muted">{getScheduleInfo(batch)}</td>
                      <td className="batch-list__muted">{batch.coach_name || '—'}</td>
                      <td className="batch-list__muted">{batch.skill_level || '—'}</td>
                      <td className="batch-list__muted">{batch.student_count ?? 0}</td>
                      {isHeadCoach && (
                        <td className="batch-list__actions">
                          <button
                            className="batch-list__edit-link"
                            onClick={() => navigate(`/batches/${batch.id}/edit`)}
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BatchListPage;

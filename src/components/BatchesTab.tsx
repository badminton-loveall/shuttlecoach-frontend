import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * BatchesTab Component
 * Manages batches with full CRUD operations for the Master Data page.
 * Props: { readOnly: boolean }
 *
 * Requirements: 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

interface BatchRecord {
  id: string;
  name: string;
  schedule: string | null;
  assigned_coach_id: string | null;
  coach_name: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface BatchFormData {
  name: string;
  schedule: string;
}

interface FormErrors {
  name?: string;
  schedule?: string;
  general?: string;
}

interface BatchesTabProps {
  readOnly: boolean;
}

const BatchesTab: React.FC<BatchesTabProps> = ({ readOnly }) => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchRecord | null>(null);
  const [formData, setFormData] = useState<BatchFormData>({ name: '', schedule: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingBatch, setDeletingBatch] = useState<BatchRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/batches');
      setBatches(response.data.batches);
    } catch (err) {
      setError('Failed to load batches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const resetForm = () => {
    setShowForm(false);
    setEditingBatch(null);
    setFormData({ name: '', schedule: '' });
    setFormErrors({});
  };

  const handleCloseForm = () => {
    if (!submitting) {
      resetForm();
    }
  };

  const handleAddClick = () => {
    setEditingBatch(null);
    setFormData({ name: '', schedule: '' });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEditClick = (batch: BatchRecord) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      schedule: batch.schedule || '',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDeleteClick = (batch: BatchRecord) => {
    setDeletingBatch(batch);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBatch) return;

    setDeleteLoading(true);
    try {
      await apiClient.delete(`/batches/${deletingBatch.id}`);
      setSuccessMessage('Batch deleted successfully');
      setDeletingBatch(null);
      await fetchBatches();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete batch.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingBatch(null);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Name must be at most 100 characters';
    }

    if (formData.schedule.length > 100) {
      errors.schedule = 'Schedule must be at most 100 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setFormErrors({});

    try {
      const payload: { name: string; schedule?: string } = {
        name: formData.name.trim(),
      };
      if (formData.schedule.trim()) {
        payload.schedule = formData.schedule.trim();
      }

      if (editingBatch) {
        await apiClient.patch(`/batches/${editingBatch.id}`, payload);
        setSuccessMessage('Batch updated successfully');
      } else {
        await apiClient.post('/batches', payload);
        setSuccessMessage('Batch created successfully');
      }

      resetForm();
      await fetchBatches();
    } catch (err: any) {
      if (err?.response?.data?.errors) {
        const serverErrors: FormErrors = {};
        for (const fieldError of err.response.data.errors) {
          if (fieldError.field === 'name') serverErrors.name = fieldError.message;
          if (fieldError.field === 'schedule') serverErrors.schedule = fieldError.message;
        }
        setFormErrors(serverErrors);
      } else {
        setFormErrors({ general: err?.response?.data?.error || 'An error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-[var(--text-secondary)]">Loading batches...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && batches.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-[var(--color-error,#dc2626)] mb-4">{error}</p>
          <button onClick={fetchBatches} className="btn btn-secondary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700" role="status">
          {successMessage}
        </div>
      )}

      {/* Error banner (non-fatal) */}
      {error && batches.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Batches ({batches.length})
        </h2>
        {!readOnly && (
          <button
            onClick={handleAddClick}
            className="btn btn-primary"
            aria-label="Add Batch"
          >
            Add Batch
          </button>
        )}
      </div>

      {/* Modal form for create/edit */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-content modal-content--small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingBatch ? 'Edit Batch' : 'Add Batch'}</h2>
              <button className="modal-close-btn" onClick={handleCloseForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-form-body">
                {formErrors.general && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-4" role="alert">
                    {formErrors.general}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="batch-name" className="form-label">
                    Name *
                  </label>
                  <input
                    id="batch-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`form-input ${formErrors.name ? 'form-input-error' : ''}`}
                    placeholder="Enter batch name"
                    disabled={submitting}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="batch-schedule" className="form-label">
                    Schedule
                  </label>
                  <input
                    id="batch-schedule"
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className={`form-input ${formErrors.schedule ? 'form-input-error' : ''}`}
                    placeholder="e.g., Mon/Wed/Fri 6:00-7:30 AM"
                    disabled={submitting}
                  />
                  {formErrors.schedule && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.schedule}</p>
                  )}
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={submitting}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Saving...' : editingBatch ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch table */}
      {batches.length === 0 ? (
        <div className="table-filter-section">
          <div className="table-empty">No batches found.</div>
        </div>
      ) : (
        <div className="table-filter-section">
          <div className="table-container">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Schedule</th>
                  <th>Coach</th>
                  {!readOnly && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="text-bold">{batch.name}</td>
                    <td className="text-muted">{batch.schedule ? `Schedule: ${batch.schedule}` : '—'}</td>
                    <td className="text-muted">{batch.coach_name ? `Coach: ${batch.coach_name}` : '—'}</td>
                    {!readOnly && (
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(batch)}
                            className="table-action-link table-action-link--info"
                            aria-label={`Edit ${batch.name}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(batch)}
                            className="table-action-link table-action-link--danger"
                            aria-label={`Delete ${batch.name}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deletingBatch && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content modal-content--small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Batch?</h2>
              <button className="modal-close-btn" onClick={handleDeleteCancel}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-[var(--text-secondary)]">
                Are you sure you want to delete <strong>{deletingBatch.name}</strong>? This action will archive the batch.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={handleDeleteCancel}
                disabled={deleteLoading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="btn btn-danger"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchesTab;

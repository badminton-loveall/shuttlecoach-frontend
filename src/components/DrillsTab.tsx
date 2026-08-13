import React, { useState, useEffect, useCallback } from 'react';
import type { Drill } from '../types';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * DrillsTab Component
 * Manages drill list display with category filter, name search, and full CRUD operations.
 * HEAD_COACH users can create, edit, and delete drills; ASSISTANT_COACH is read-only.
 *
 * Requirements: 5.4, 5.7, 5.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

interface DrillsTabProps {
  readOnly: boolean;
}

interface DrillFormData {
  name: string;
  description: string;
  category: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
}

const DRILL_CATEGORIES = [
  'Fundamentals',
  'Footwork',
  'Stroke Practice',
  'Combination Drills',
  'Net Play',
  'Service',
  'Return',
  'Defense',
  'Rally',
  'Match Practice',
];

const emptyFormData: DrillFormData = { name: '', description: '', category: '' };

export const DrillsTab: React.FC<DrillsTabProps> = ({ readOnly }) => {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingDrill, setEditingDrill] = useState<Drill | null>(null);
  const [formData, setFormData] = useState<DrillFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deletingDrill, setDeletingDrill] = useState<Drill | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDrills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      const response = await apiClient.get('/drills', { params });
      setDrills(response.data.drills);
    } catch {
      setError('Failed to load drills. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    fetchDrills();
  }, [fetchDrills]);

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Name must be at most 100 characters';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      errors.description = 'Description must be at most 1000 characters';
    }
    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setEditingDrill(null);
    setFormData(emptyFormData);
    setFormErrors({});
    setShowForm(true);
  };

  const handleOpenEdit = (drill: Drill) => {
    setEditingDrill(drill);
    setFormData({
      name: drill.name,
      description: drill.description,
      category: drill.category,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDrill(null);
    setFormData(emptyFormData);
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingDrill) {
        await apiClient.patch(`/drills/${editingDrill.id}`, formData);
        setSuccessMessage('Drill updated successfully');
      } else {
        await apiClient.post('/drills', formData);
        setSuccessMessage('Drill created successfully');
      }
      handleCloseForm();
      fetchDrills();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { errors?: Array<{ field: string; message: string }> } } };
        const serverErrors = axiosErr.response?.data?.errors;
        if (serverErrors && Array.isArray(serverErrors)) {
          const mapped: FormErrors = {};
          serverErrors.forEach((e) => {
            if (e.field === 'name') mapped.name = e.message;
            if (e.field === 'description') mapped.description = e.message;
            if (e.field === 'category') mapped.category = e.message;
          });
          setFormErrors(mapped);
        } else {
          setFormErrors({ name: 'An error occurred. Please try again.' });
        }
      } else {
        setFormErrors({ name: 'An error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (drill: Drill) => {
    setDeletingDrill(drill);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDrill) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/drills/${deletingDrill.id}`);
      setSuccessMessage('Drill deleted successfully');
      setDeletingDrill(null);
      fetchDrills();
    } catch {
      setError('Failed to delete drill. Please try again.');
      setDeletingDrill(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingDrill(null);
  };

  // Loading state
  if (loading && drills.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/3"></div>
            <div className="h-10 bg-[var(--bg-tertiary)] rounded w-full"></div>
            <div className="h-10 bg-[var(--bg-tertiary)] rounded w-full"></div>
            <div className="h-10 bg-[var(--bg-tertiary)] rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && drills.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <p className="text-[var(--color-error,#dc2626)] mb-4">{error}</p>
          <button onClick={fetchDrills} className="btn btn-secondary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success feedback */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {/* Error feedback (inline) */}
      {error && drills.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDrills} className="btn btn-secondary text-xs ml-2">
            Retry
          </button>
        </div>
      )}

      {/* Toolbar: Filter, Search, Add Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="form-input text-sm"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {DRILL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search drills by name..."
          className="form-input text-sm flex-1"
          aria-label="Search drills"
        />

        {/* Add Drill Button */}
        {!readOnly && (
          <button onClick={handleOpenCreate} className="btn btn-primary text-sm whitespace-nowrap">
            Add Drill
          </button>
        )}
      </div>

      {/* Modal Form (Create/Edit) */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content modal-content--small">
            <div className="modal-header">
              <h2 className="modal-title">{editingDrill ? 'Edit Drill' : 'Add Drill'}</h2>
              <button className="modal-close-btn" onClick={handleCloseForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-form-body">
                {/* Name Field */}
                <div className="form-group">
                  <label htmlFor="drill-name" className="form-label">
                    Name
                  </label>
                  <input
                    id="drill-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`form-input ${formErrors.name ? 'form-input-error' : ''}`}
                    placeholder="Enter drill name"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Description Field */}
                <div className="form-group">
                  <label htmlFor="drill-description" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="drill-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`form-input ${formErrors.description ? 'form-input-error' : ''}`}
                    placeholder="Enter drill description"
                    rows={3}
                  />
                  {formErrors.description && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                  )}
                </div>

                {/* Category Field */}
                <div className="form-group">
                  <label htmlFor="drill-category" className="form-label">
                    Category
                  </label>
                  <select
                    id="drill-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`form-input ${formErrors.category ? 'form-input-error' : ''}`}
                  >
                    <option value="">Select a category</option>
                    {DRILL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
                  )}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={handleCloseForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : editingDrill ? 'Update Drill' : 'Create Drill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingDrill && (
        <div className="modal-overlay">
          <div className="modal-content modal-content--small">
            <div className="modal-header">
              <h2 className="modal-title text-red-600 dark:text-red-400">Delete Drill?</h2>
              <button className="modal-close-btn" onClick={handleCancelDelete}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-[var(--text-secondary)]">
                Are you sure you want to delete &ldquo;{deletingDrill.name}&rdquo;? This action will archive the drill.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={handleCancelDelete} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="btn btn-danger"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drill Table */}
      {drills.length === 0 ? (
        <div className="table-filter-section">
          <div className="table-empty">No drills found</div>
        </div>
      ) : (
        <div className="table-filter-section">
          <div className="table-container">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Category</th>
                  {!readOnly && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {drills.map((drill) => (
                  <tr key={drill.id}>
                    <td className="text-bold">{drill.name}</td>
                    <td className="text-muted">{drill.description}</td>
                    <td>
                      <span className="table-badge table-badge--pending">{drill.category}</span>
                    </td>
                    {!readOnly && (
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEdit(drill)}
                            className="table-action-link table-action-link--info"
                            aria-label={`Edit ${drill.name}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(drill)}
                            className="table-action-link table-action-link--danger"
                            aria-label={`Delete ${drill.name}`}
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
    </div>
  );
};

export default DrillsTab;

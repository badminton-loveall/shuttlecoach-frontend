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
  coach_role: string | null;
  template_name: string | null;
  curriculum_id: string | null;
  curriculum_name: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  capacity?: number;
  skill_level?: string;
  monthly_fee?: number;
  days_of_week?: string[];
  start_time?: string;
  end_time?: string;
  description?: string;
  template_id?: string | null;
  student_count?: number;
}

interface TemplateOption {
  id: string;
  name: string;
}

interface CourseOption {
  id: string;
  name: string;
  weekCount: number;
}

interface BatchFormData {
  name: string;
  schedule: string;
  assignedCoachId: string | null;
  capacity: number | '';
  skillLevel: '' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
  monthlyFee: number | '';
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  description: string;
  template_id: string | null;
  curriculum_id: string | null;
}

interface FormErrors {
  name?: string;
  schedule?: string;
  general?: string;
  assignedCoachId?: string;
  capacity?: string;
  skillLevel?: string;
  monthlyFee?: string;
  daysOfWeek?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
}

interface Coach {
  id: string;
  name: string;
  role: string;
}

interface BatchesTabProps {
  readOnly: boolean;
}

/**
 * Simple inline component to show students assigned to a batch.
 */
const StudentListForBatch: React.FC<{ batchId: string }> = ({ batchId }) => {
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await apiClient.get(`/students?batch=${batchId}&limit=100`);
        const data = response.data?.students || response.data || [];
        setStudents(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, full_name: s.fullName || s.full_name })) : []);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [batchId]);

  if (loading) return <p style={{ margin: '0.5rem 0', color: 'var(--text-tertiary)' }}>Loading...</p>;
  if (students.length === 0) return <p style={{ margin: '0.5rem 0', color: 'var(--text-tertiary)' }}>No students in this batch.</p>;

  return (
    <ul style={{ margin: '0.5rem 0', padding: '0 0 0 1.25rem', listStyle: 'disc' }}>
      {students.map(s => (
        <li key={s.id} style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{s.full_name}</li>
      ))}
    </ul>
  );
};

const BatchesTab: React.FC<BatchesTabProps> = ({ readOnly }) => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchRecord | null>(null);
  const [formData, setFormData] = useState<BatchFormData>({ 
    name: '', 
    schedule: '', 
    assignedCoachId: null, 
    capacity: '', 
    skillLevel: '', 
    monthlyFee: '', 
    daysOfWeek: [], 
    startTime: '', 
    endTime: '', 
    description: '',
    template_id: null,
    curriculum_id: null,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingBatch, setDeletingBatch] = useState<BatchRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Coach list state
  const [coaches, setCoaches] = useState<Coach[]>([]);

  // Template list state for assignment dropdown
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  // Course list state for curriculum assignment dropdown
  const [courses, setCourses] = useState<CourseOption[]>([]);

  // Expanded batch row state for CoachAssignmentPanel
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

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

  // Fetch coaches for the assignment dropdown
  const fetchCoaches = async () => {
    try {
      const response = await apiClient.get('/coaches');
      // API returns array directly (not wrapped in { coaches: [...] })
      const coachData = Array.isArray(response.data) ? response.data : (response.data.coaches || []);
      setCoaches(coachData);
    } catch (err) {
      // Gracefully handle - coach dropdown will be empty but form still works
      console.error('Failed to fetch coaches:', err);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  // Fetch available templates for assignment dropdown
  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/batch-time-templates');
      const data = Array.isArray(response.data) ? response.data : [];
      setTemplates(data.map((t: any) => ({ id: t.id, name: t.name })));
    } catch (err) {
      // Gracefully handle — template dropdown will be empty but page still works
      console.error('Failed to fetch templates:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch available courses for curriculum assignment dropdown
  const fetchCourses = async () => {
    try {
      const response = await apiClient.get('/courses');
      const data = response.data?.courses || [];
      setCourses(data.map((c: any) => ({ id: c.id, name: c.name, weekCount: c.weeks?.length || 0 })));
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingBatch(null);
    setFormData({ 
      name: '', 
      schedule: '', 
      assignedCoachId: null, 
      template_id: null,
      curriculum_id: null,
      capacity: '', 
      skillLevel: '', 
      monthlyFee: '', 
      daysOfWeek: [], 
      startTime: '', 
      endTime: '', 
      description: '' 
    });
    setFormErrors({});
  };

  const handleCloseForm = () => {
    if (!submitting) {
      resetForm();
    }
  };

  const handleAddClick = () => {
    setEditingBatch(null);
    setFormData({ 
      name: '', 
      schedule: '', 
      assignedCoachId: null, 
      capacity: '', 
      skillLevel: '', 
      monthlyFee: '', 
      daysOfWeek: [], 
      startTime: '', 
      endTime: '', 
      description: '',
      template_id: null,
      curriculum_id: null,
    });
    setFormErrors({});
    setShowForm(true);
    // Re-fetch coaches when opening modal in case initial fetch failed
    if (coaches.length === 0) {
      fetchCoaches();
    }
  };

  const handleEditClick = (batch: BatchRecord) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      schedule: batch.schedule || '',
      assignedCoachId: batch.assigned_coach_id || null,
      capacity: batch.capacity ?? '',
      skillLevel: (batch.skill_level as BatchFormData['skillLevel']) || '',
      monthlyFee: batch.monthly_fee ?? '',
      daysOfWeek: batch.days_of_week || [],
      startTime: batch.start_time || '',
      endTime: batch.end_time || '',
      description: batch.description || '',
      template_id: batch.template_id || null,
      curriculum_id: batch.curriculum_id || null,
    });
    setFormErrors({});
    setShowForm(true);
    // Re-fetch coaches when opening modal in case initial fetch failed
    if (coaches.length === 0) {
      fetchCoaches();
    }
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

    if (formData.capacity !== '' && formData.capacity < 0) {
      errors.capacity = 'Capacity must be non-negative';
    }

    if (formData.monthlyFee !== '' && formData.monthlyFee < 0) {
      errors.monthlyFee = 'Monthly fee must be non-negative';
    }

    if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
      errors.endTime = 'End time must be after start time';
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
      const payload: Record<string, any> = {
        name: formData.name.trim(),
      };

      // Auto-generate schedule text from days + times
      const dayAbbrevs = formData.daysOfWeek;
      if (dayAbbrevs.length > 0 || formData.startTime || formData.endTime) {
        const parts: string[] = [];
        if (dayAbbrevs.length > 0) parts.push(dayAbbrevs.join('/'));
        if (formData.startTime && formData.endTime) {
          parts.push(`${formData.startTime}-${formData.endTime}`);
        } else if (formData.startTime) {
          parts.push(formData.startTime);
        }
        payload.schedule = parts.join(' ');
      } else if (formData.schedule.trim()) {
        payload.schedule = formData.schedule.trim();
      }
      if (formData.assignedCoachId) {
        payload.assigned_coach_id = formData.assignedCoachId;
      }
      if (formData.capacity !== '') {
        payload.capacity = formData.capacity;
      }
      if (formData.skillLevel) {
        payload.skill_level = formData.skillLevel;
      }
      if (formData.monthlyFee !== '') {
        payload.monthly_fee = formData.monthlyFee;
      }
      if (formData.daysOfWeek.length > 0) {
        payload.days_of_week = formData.daysOfWeek;
      }
      if (formData.startTime) {
        payload.start_time = formData.startTime;
      }
      if (formData.endTime) {
        payload.end_time = formData.endTime;
      }
      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }
      if (formData.template_id) {
        payload.template_id = formData.template_id;
      }
      if (formData.curriculum_id) {
        payload.curriculum_id = formData.curriculum_id;
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
          if (fieldError.field === 'assigned_coach_id') serverErrors.assignedCoachId = fieldError.message;
          if (fieldError.field === 'capacity') serverErrors.capacity = fieldError.message;
          if (fieldError.field === 'skill_level') serverErrors.skillLevel = fieldError.message;
          if (fieldError.field === 'monthly_fee') serverErrors.monthlyFee = fieldError.message;
          if (fieldError.field === 'days_of_week') serverErrors.daysOfWeek = fieldError.message;
          if (fieldError.field === 'start_time') serverErrors.startTime = fieldError.message;
          if (fieldError.field === 'end_time') serverErrors.endTime = fieldError.message;
          if (fieldError.field === 'description') serverErrors.description = fieldError.message;
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
          <div className="modal-content" style={{ maxWidth: '540px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ paddingBottom: '0.5rem' }}>
              <h2 className="modal-title">{editingBatch ? 'Edit Batch' : 'Add Batch'}</h2>
              <button className="modal-close-btn" onClick={handleCloseForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-form-body" style={{ gap: '0.75rem' }}>
                {formErrors.general && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-2" role="alert">
                    {formErrors.general}
                  </div>
                )}

                {/* Row 1: Name + Coach */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="batch-name" className="form-label">
                      Name *
                    </label>
                    <input
                      id="batch-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`form-input ${formErrors.name ? 'form-input-error' : ''}`}
                      placeholder="Batch name"
                      disabled={submitting}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-0.5">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="batch-coach" className="form-label">
                      Coach Assignment
                    </label>
                    <select
                      id="batch-coach"
                      value={formData.assignedCoachId || ''}
                      onChange={(e) => setFormData({ ...formData, assignedCoachId: e.target.value || null })}
                      className={`form-input ${formErrors.assignedCoachId ? 'form-input-error' : ''}`}
                      disabled={submitting}
                    >
                      <option value="">Select coach...</option>
                      {coaches.filter(c => c.role === 'HEAD_COACH').length > 0 && (
                        <optgroup label="Head Coach">
                          {coaches.filter(c => c.role === 'HEAD_COACH').map(coach => (
                            <option key={coach.id} value={coach.id}>{coach.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {coaches.filter(c => c.role === 'ASSISTANT_COACH').length > 0 && (
                        <optgroup label="Assistant Coach">
                          {coaches.filter(c => c.role === 'ASSISTANT_COACH').map(coach => (
                            <option key={coach.id} value={coach.id}>{coach.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    {formErrors.assignedCoachId && (
                      <p className="text-red-500 text-xs mt-0.5">{formErrors.assignedCoachId}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Batch Template */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="batch-template" className="form-label">
                    Batch Template <span style={{ fontWeight: 'normal', color: 'var(--text-tertiary)' }}>(for timing)</span>
                  </label>
                  <select
                    id="batch-template"
                    value={formData.template_id || ''}
                    onChange={(e) => setFormData({ ...formData, template_id: e.target.value || null })}
                    className="form-input"
                    disabled={submitting}
                  >
                    <option value="">No template</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Row 3: Curriculum */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="batch-curriculum" className="form-label">
                    Curriculum <span style={{ fontWeight: 'normal', color: 'var(--text-tertiary)' }}>(course template)</span>
                  </label>
                  <select
                    id="batch-curriculum"
                    value={formData.curriculum_id || ''}
                    onChange={(e) => setFormData({ ...formData, curriculum_id: e.target.value || null })}
                    className="form-input"
                    disabled={submitting}
                  >
                    <option value="">No curriculum</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.weekCount}w)</option>
                    ))}
                  </select>
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
                  <th>Coach</th>
                  <th>Template</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <React.Fragment key={batch.id}>
                    <tr
                      onClick={() => setExpandedBatchId(expandedBatchId === batch.id ? null : batch.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="text-bold">{batch.name}</td>
                      <td className="text-muted">{batch.coach_name || '—'}</td>
                      <td className="text-muted">{batch.template_name || '—'}</td>
                      <td className="text-muted">{batch.student_count || 0}</td>
                      <td>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {!readOnly && (
                            <>
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedBatchId === batch.id && (
                      <tr>
                        <td colSpan={5} style={{ padding: '1rem', backgroundColor: 'var(--surface-hover)' }}>
                          <div style={{ fontSize: 'var(--font-sm)' }}>
                            <strong>Students in this batch:</strong>
                            <StudentListForBatch batchId={batch.id} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import apiClient from '../utils/apiClient';
import TemplateFormModal from './TemplateFormModal';
import '../styles/pages.css';

/**
 * TemplatesTab Component
 * Manages batch time templates for the Master Data (Settings) page.
 * Props: { readOnly: boolean }
 *
 * The "create" action is triggered from the parent page's header (see
 * BatchTimingsPage) rather than from a button inside this component, so the
 * create-modal trigger is exposed via a ref.
 *
 * Requirements: 1.1, 6.1, 6.2, 6.3, 6.4
 */

interface TemplateRecord {
  id: string;
  name: string;
  is_archived: boolean;
  slot_count: number;
  created_at: string;
  updated_at: string;
}

interface TemplatesTabProps {
  readOnly: boolean;
}

export interface TemplatesTabHandle {
  openCreateModal: () => void;
}

const TemplatesTab = forwardRef<TemplatesTabHandle, TemplatesTabProps>(({ readOnly }, ref) => {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRecord | null>(null);
  const [editingTemplateWithSlots, setEditingTemplateWithSlots] = useState<{
    id: string;
    name: string;
    slots: Array<{ day_of_week: string; start_time: string; duration_hours: number }>;
  } | null>(null);

  // Delete confirmation state
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/batch-time-templates');
      const data = response.data;
      // API returns array or { templates: [...] }
      const templateList: TemplateRecord[] = Array.isArray(data)
        ? data
        : data.templates || [];
      setTemplates(templateList);
    } catch {
      setError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleCreateClick = () => {
    setEditingTemplate(null);
    setEditingTemplateWithSlots(null);
    setShowForm(true);
  };

  useImperativeHandle(ref, () => ({ openCreateModal: handleCreateClick }));

  const handleEditClick = async (template: TemplateRecord) => {
    try {
      const response = await apiClient.get(`/batch-time-templates/${template.id}`);
      const fullTemplate = response.data;
      setEditingTemplate(template);
      setEditingTemplateWithSlots({
        id: fullTemplate.id,
        name: fullTemplate.name,
        slots: (fullTemplate.slots || []).map((s: any) => ({
          day_of_week: s.day_of_week,
          start_time: typeof s.start_time === 'string' ? s.start_time.substring(0, 5) : s.start_time,
          duration_hours: s.duration_hours,
        })),
      });
      setShowForm(true);
    } catch {
      setError('Failed to load template details.');
    }
  };

  const handleDeleteClick = (template: TemplateRecord) => {
    setDeletingTemplate(template);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTemplate) return;

    setDeleteLoading(true);
    try {
      await apiClient.delete(`/batch-time-templates/${deletingTemplate.id}`);
      setSuccessMessage('Template deleted successfully');
      setDeletingTemplate(null);
      await fetchTemplates();
    } catch (err: any) {
      const serverError =
        err?.response?.data?.error || 'Failed to delete template.';
      setError(serverError);
      setDeletingTemplate(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingTemplate(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setEditingTemplateWithSlots(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setEditingTemplateWithSlots(null);
    setSuccessMessage(
      editingTemplate ? 'Template updated successfully' : 'Template created successfully'
    );
    fetchTemplates();
  };

  // Loading state
  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-[var(--text-secondary)]">Loading templates...</p>
        </div>
      </div>
    );
  }

  // Error state (no data loaded)
  if (error && templates.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-[var(--color-error,#dc2626)] mb-4">{error}</p>
          <button onClick={fetchTemplates} className="btn btn-secondary">
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
        <div
          className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {/* Error banner (non-fatal, data still visible) */}
      {error && templates.length > 0 && (
        <div
          className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Template table */}
      {templates.length === 0 ? (
        <div className="table-filter-section">
          <div className="table-empty">No templates found.</div>
        </div>
      ) : (
        <div className="table-filter-section">
          <div className="table-container">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slots</th>
                  {!readOnly && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td className="text-bold">{template.name}</td>
                    <td className="text-muted">
                      {template.slot_count}{' '}
                      {template.slot_count === 1 ? 'slot' : 'slots'}
                    </td>
                    {!readOnly && (
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(template)}
                            className="table-action-link table-action-link--info"
                            aria-label={`Edit ${template.name}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(template)}
                            className="table-action-link table-action-link--danger"
                            aria-label={`Delete ${template.name}`}
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

      {/* Template Create/Edit Modal */}
      <TemplateFormModal
        isOpen={showForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        editingTemplate={editingTemplateWithSlots}
      />

      {/* Delete confirmation dialog */}
      {deletingTemplate && (
        <div className="modal-overlay">
          <div
            className="modal-content modal-content--small"
          >
            <div className="modal-header">
              <h2 className="modal-title">Delete Template?</h2>
              <button className="modal-close-btn" onClick={handleDeleteCancel}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-[var(--text-secondary)]">
                Are you sure you want to delete{' '}
                <strong>{deletingTemplate.name}</strong>? This action will
                archive the template.
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
});

TemplatesTab.displayName = 'TemplatesTab';

export default TemplatesTab;

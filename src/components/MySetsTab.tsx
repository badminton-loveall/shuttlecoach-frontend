import React, { useState, useEffect, useCallback } from 'react';
import type { Drill, DrillSet, DrillSetCategory } from '../types';
import { useDrillSets } from '../hooks/useDrillSets';
import { useDrills } from '../hooks/useDrills';
import { SPORT_LABELS, SUPPORTED_SPORTS } from '../constants/sports';
import '../styles/pages.css';

/**
 * MySetsTab Component
 * Lets a coach build a Drill Set: create it, add named Categories, place
 * existing drills under each Category ("Add Drills"), then submit the whole
 * set for admin review so it can be published to the Marketplace.
 */

const STATUS_BADGE_CLASS: Record<string, string> = {
  draft: 'table-badge--waived',
  pending_review: 'table-badge--pending',
  published: 'table-badge--success',
  rejected: 'table-badge--overdue',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  rejected: 'Rejected',
};

interface SetFormData {
  name: string;
  description: string;
  sport: string;
}

const emptyFormData: SetFormData = { name: '', description: '', sport: '' };

export const MySetsTab: React.FC = () => {
  const {
    sets,
    loading,
    error,
    refetch,
    createSet,
    updateSet,
    deleteSet,
    getSetDetail,
    createSetCategory,
    deleteSetCategory,
    addDrillToSetCategory,
    removeDrillFromSetCategory,
    submitSet,
  } = useDrillSets();

  const { drills: allDrills } = useDrills();

  const [showForm, setShowForm] = useState(false);
  const [editingSet, setEditingSet] = useState<DrillSet | null>(null);
  const [formData, setFormData] = useState<SetFormData>(emptyFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deletingSet, setDeletingSet] = useState<DrillSet | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [buildingSet, setBuildingSet] = useState<DrillSet | null>(null);
  const [buildCategories, setBuildCategories] = useState<DrillSetCategory[]>([]);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addDrillSelections, setAddDrillSelections] = useState<Record<string, string>>({});

  const [submitTargetId, setSubmitTargetId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleOpenCreate = () => {
    setEditingSet(null);
    setFormData(emptyFormData);
    setFormError(null);
    setShowForm(true);
  };

  const handleOpenEdit = (set: DrillSet) => {
    setEditingSet(set);
    setFormData({ name: set.name, description: set.description || '', sport: set.sport || '' });
    setFormError(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSet(null);
    setFormData(emptyFormData);
    setFormError(null);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sport: formData.sport || undefined,
      };
      if (editingSet) {
        await updateSet(editingSet.id, payload);
        setSuccessMessage('Set updated');
        handleCloseForm();
      } else {
        const created = await createSet(payload);
        setSuccessMessage('Set created — now add categories and drills');
        handleCloseForm();
        await handleOpenBuilder(created);
      }
    } catch {
      setFormError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (set: DrillSet) => setDeletingSet(set);

  const handleConfirmDelete = async () => {
    if (!deletingSet) return;
    setDeleteLoading(true);
    try {
      await deleteSet(deletingSet.id);
      setSuccessMessage('Set deleted');
      setDeletingSet(null);
    } catch {
      setDeletingSet(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const loadBuilderDetail = useCallback(async (set: DrillSet) => {
    setBuildLoading(true);
    setBuildError(null);
    try {
      const detail = await getSetDetail(set.id);
      setBuildCategories(detail.categories || []);
    } catch {
      setBuildError('Failed to load this set.');
    } finally {
      setBuildLoading(false);
    }
  }, [getSetDetail]);

  const handleOpenBuilder = async (set: DrillSet) => {
    setBuildingSet(set);
    setNewCategoryName('');
    setAddDrillSelections({});
    await loadBuilderDetail(set);
  };

  const handleCloseBuilder = async () => {
    setBuildingSet(null);
    setBuildCategories([]);
    setBuildError(null);
    await refetch();
  };

  const handleAddCategory = async () => {
    if (!buildingSet || !newCategoryName.trim()) return;
    setBuildError(null);
    try {
      await createSetCategory(buildingSet.id, newCategoryName.trim());
      setNewCategoryName('');
      await loadBuilderDetail(buildingSet);
    } catch {
      setBuildError('Failed to add category.');
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    if (!buildingSet) return;
    setBuildError(null);
    try {
      await deleteSetCategory(buildingSet.id, categoryId);
      await loadBuilderDetail(buildingSet);
    } catch {
      setBuildError('Failed to remove category.');
    }
  };

  const handleAddDrill = async (categoryId: string) => {
    const drillId = addDrillSelections[categoryId];
    if (!buildingSet || !drillId) return;
    setBuildError(null);
    try {
      await addDrillToSetCategory(buildingSet.id, categoryId, drillId);
      setAddDrillSelections((prev) => ({ ...prev, [categoryId]: '' }));
      await loadBuilderDetail(buildingSet);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setBuildError(axiosErr.response?.data?.error || 'Failed to add drill.');
      } else {
        setBuildError('Failed to add drill.');
      }
    }
  };

  const handleRemoveDrill = async (categoryId: string, drillId: string) => {
    if (!buildingSet) return;
    setBuildError(null);
    try {
      await removeDrillFromSetCategory(buildingSet.id, categoryId, drillId);
      await loadBuilderDetail(buildingSet);
    } catch {
      setBuildError('Failed to remove drill.');
    }
  };

  const handleSubmitSet = async (set: DrillSet) => {
    setSubmitTargetId(set.id);
    try {
      await submitSet(set.id);
      setSuccessMessage('Set submitted for review');
      if (buildingSet?.id === set.id) {
        await handleCloseBuilder();
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        alert(axiosErr.response?.data?.error || 'Failed to submit set.');
      }
    } finally {
      setSubmitTargetId(null);
    }
  };

  const totalBuildDrills = buildCategories.reduce((sum, c) => sum + (c.drills?.length || 0), 0);

  if (loading && sets.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-[var(--text-secondary)]">Loading your sets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={refetch} className="btn btn-secondary text-xs ml-2">Retry</button>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={handleOpenCreate} className="btn btn-primary text-sm whitespace-nowrap">
          + Add Drills
        </button>
      </div>

      {/* Create/Edit Set Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content modal-content--small">
            <div className="modal-header">
              <h2 className="modal-title">{editingSet ? 'Edit Set' : 'New Set'}</h2>
              <button className="modal-close-btn" onClick={handleCloseForm}>✕</button>
            </div>
            <form onSubmit={handleSubmitForm} className="modal-form">
              <div className="modal-form-body">
                <div className="form-group">
                  <label htmlFor="set-name" className="form-label">Name</label>
                  <input
                    id="set-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Beginner Foundations Pack"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="set-description" className="form-label">Description</label>
                  <textarea
                    id="set-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-input"
                    placeholder="What is this set for?"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="set-sport" className="form-label">Sport</label>
                  <select
                    id="set-sport"
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Not specified</option>
                    {SUPPORTED_SPORTS.map((sport) => (
                      <option key={sport} value={sport}>{SPORT_LABELS[sport]}</option>
                    ))}
                  </select>
                </div>
                {formError && <p className="text-red-500 text-xs mt-1">{formError}</p>}
              </div>
              <div className="form-actions">
                <button type="button" onClick={handleCloseForm} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : editingSet ? 'Save Changes' : 'Create & Add Drills'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingSet && (
        <div className="modal-overlay">
          <div className="modal-content modal-content--small">
            <div className="modal-header">
              <h2 className="modal-title text-red-600 dark:text-red-400">Delete Set?</h2>
              <button className="modal-close-btn" onClick={() => setDeletingSet(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-[var(--text-secondary)]">
                Are you sure you want to delete &ldquo;{deletingSet.name}&rdquo;?
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeletingSet(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleConfirmDelete} disabled={deleteLoading} className="btn btn-danger">
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Builder Modal: categories + drills */}
      {buildingSet && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{buildingSet.name}</h2>
              <button className="modal-close-btn" onClick={handleCloseBuilder}>✕</button>
            </div>
            <div className="modal-body">
              {buildError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm mb-3">
                  {buildError}
                </div>
              )}

              {buildingSet.status === 'draft' && (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name (e.g. Footwork)"
                    className="form-input text-sm flex-1"
                  />
                  <button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="btn btn-primary text-sm">
                    Add Category
                  </button>
                </div>
              )}

              {buildLoading ? (
                <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
              ) : buildCategories.length === 0 ? (
                <div className="table-empty">No categories yet — add one above, then add drills under it.</div>
              ) : (
                <div className="space-y-4">
                  {buildCategories.map((category) => {
                    const categoryDrillIds = new Set((category.drills || []).map((d) => d.id));
                    const eligibleDrills = allDrills.filter((d: Drill) => !categoryDrillIds.has(d.id));
                    return (
                      <div key={category.id} className="card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-[var(--text-primary)]">{category.name}</h3>
                          {buildingSet.status === 'draft' && (
                            <button
                              onClick={() => handleRemoveCategory(category.id)}
                              className="table-action-link table-action-link--danger text-xs"
                            >
                              Remove Category
                            </button>
                          )}
                        </div>

                        {buildingSet.status === 'draft' && (
                          <div className="flex gap-2 mb-3">
                            <select
                              value={addDrillSelections[category.id] || ''}
                              onChange={(e) =>
                                setAddDrillSelections((prev) => ({ ...prev, [category.id]: e.target.value }))
                              }
                              className="form-input text-sm flex-1"
                              aria-label={`Select a drill to add to ${category.name}`}
                            >
                              <option value="">Select a drill to add...</option>
                              {eligibleDrills.map((d) => (
                                <option key={d.id} value={d.id}>{d.name} ({d.category})</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAddDrill(category.id)}
                              disabled={!addDrillSelections[category.id]}
                              className="btn btn-secondary text-sm"
                            >
                              Add
                            </button>
                          </div>
                        )}

                        {category.drills && category.drills.length > 0 ? (
                          <ul className="space-y-1">
                            {category.drills.map((drill) => (
                              <li key={drill.id} className="flex items-center justify-between text-sm py-1">
                                <span>{drill.name}</span>
                                {buildingSet.status === 'draft' && (
                                  <button
                                    onClick={() => handleRemoveDrill(category.id, drill.id)}
                                    className="table-action-link table-action-link--danger text-xs"
                                  >
                                    Remove
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-[var(--text-secondary)]">No drills in this category yet.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseBuilder} className="btn btn-secondary">Close</button>
              {buildingSet.status === 'draft' && (
                <button
                  onClick={() => handleSubmitSet(buildingSet)}
                  disabled={submitTargetId === buildingSet.id || totalBuildDrills === 0}
                  className="btn btn-primary"
                  title={totalBuildDrills === 0 ? 'Add at least one drill first' : undefined}
                >
                  {submitTargetId === buildingSet.id ? 'Submitting...' : 'Submit for Review'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sets Table */}
      {sets.length === 0 ? (
        <div className="table-filter-section">
          <div className="table-empty">
            You haven&apos;t built any sets yet. Click &ldquo;+ Add Drills&rdquo; to start one.
          </div>
        </div>
      ) : (
        <div className="table-filter-section">
          <div className="table-container">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Sport</th>
                  <th>Drills</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sets.map((set) => (
                  <React.Fragment key={set.id}>
                    <tr>
                      <td className="text-bold">{set.name}</td>
                      <td className="text-muted">
                        {set.sport ? SPORT_LABELS[set.sport as keyof typeof SPORT_LABELS] || set.sport : '—'}
                      </td>
                      <td>{set.drillCount ?? 0}</td>
                      <td>
                        <span className={`table-badge ${STATUS_BADGE_CLASS[set.status]}`}>
                          {STATUS_LABEL[set.status]}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleOpenBuilder(set)}
                            className="table-action-link table-action-link--info"
                          >
                            {set.status === 'draft' ? 'Manage' : 'View'}
                          </button>
                          {(set.status === 'draft' || set.status === 'rejected') && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(set)}
                                className="table-action-link table-action-link--info"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(set)}
                                className="table-action-link table-action-link--danger"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {set.status === 'draft' && (
                            <button
                              onClick={() => handleSubmitSet(set)}
                              disabled={submitTargetId === set.id || (set.drillCount ?? 0) === 0}
                              className="table-action-link table-action-link--info"
                              title={(set.drillCount ?? 0) === 0 ? 'Add at least one drill first' : undefined}
                            >
                              {submitTargetId === set.id ? 'Submitting...' : 'Submit for Review'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {set.status === 'rejected' && set.rejectionReason && (
                      <tr>
                        <td colSpan={5} className="text-muted text-sm">
                          Rejection reason: {set.rejectionReason}
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
    </div>
  );
};

export default MySetsTab;

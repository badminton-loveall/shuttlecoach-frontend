import React, { useState, useMemo } from 'react';
import { useAdminDrills } from '../hooks/useAdminDrills';
import { SUPPORTED_SPORTS, SPORT_LABELS } from '../constants/sports';
import type { Sport } from '../constants/sports';
import type { CreateDrillPayload, UpdateDrillPayload } from '../hooks/useAdminDrills';
import './AdminDrillCatalog.css';

/**
 * AdminDrillCatalog
 * Admin interface for managing the global drill catalog.
 * Provides CRUD operations, filtering by sport/category, and search.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

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
] as const;

interface DrillRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  sport: Sport;
  videoUrl?: string | null;
}

export const AdminDrillCatalog: React.FC = () => {
  // Filter state
  const [sportFilter, setSportFilter] = useState<Sport | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // UI state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDrillId, setEditingDrillId] = useState<string | null>(null);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [createSport, setCreateSport] = useState<Sport>('badminton');
  const [createVideoUrl, setCreateVideoUrl] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSport, setEditSport] = useState<Sport>('badminton');
  const [editVideoUrl, setEditVideoUrl] = useState('');

  // Build hook options from filters
  const hookOptions = useMemo(() => ({
    sport: sportFilter || undefined,
    category: categoryFilter || undefined,
    search: searchInput || undefined,
  }), [sportFilter, categoryFilter, searchInput]);

  const { drills, loading, error, createDrill, updateDrill, archiveDrill, refetch } = useAdminDrills(hookOptions);

  // --- Handlers ---

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createCategory || !createSport) return;

    const payload: CreateDrillPayload = {
      name: createName.trim(),
      description: createDescription.trim(),
      category: createCategory,
      sport: createSport,
      videoUrl: createVideoUrl.trim() || undefined,
    };

    try {
      await createDrill(payload);
      // Reset form
      setCreateName('');
      setCreateDescription('');
      setCreateCategory('');
      setCreateSport('badminton');
      setCreateVideoUrl('');
      setShowCreateForm(false);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleEditStart = (drill: DrillRecord) => {
    setEditingDrillId(drill.id);
    setEditName(drill.name);
    setEditDescription(drill.description);
    setEditCategory(drill.category);
    setEditSport(drill.sport);
    setEditVideoUrl(drill.videoUrl || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrillId || !editName.trim() || !editCategory || !editSport) return;

    const payload: UpdateDrillPayload = {
      name: editName.trim(),
      description: editDescription.trim(),
      category: editCategory,
      sport: editSport,
      videoUrl: editVideoUrl.trim(),
    };

    try {
      await updateDrill(editingDrillId, payload);
      setEditingDrillId(null);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleEditCancel = () => {
    setEditingDrillId(null);
  };

  const handleArchive = async (drillId: string, drillName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to archive "${drillName}"? This will remove it from the marketplace.`
    );
    if (!confirmed) return;

    try {
      await archiveDrill(drillId);
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <div className="admin-drill-catalog">
      {/* Header */}
      <div className="admin-drill-catalog__header">
        <div>
          <h1 className="admin-page-title">Drill Catalog</h1>
          <p className="admin-page-subtitle">
            Manage global drills available in the marketplace
          </p>
        </div>
        <button
          className="admin-drill-catalog__create-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
          aria-expanded={showCreateForm}
        >
          {showCreateForm ? 'Cancel' : '+ Create Drill'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="admin-drill-catalog__error" role="alert">
          <p>{error}</p>
          <button
            className="admin-drill-catalog__btn-secondary"
            onClick={() => { void refetch(); }}
            style={{ marginTop: '8px' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <form
          className="admin-drill-catalog__form"
          onSubmit={handleCreateSubmit}
          aria-label="Create drill form"
        >
          <h2 className="admin-drill-catalog__form-title">New Drill</h2>
          <div className="admin-drill-catalog__form-grid">
            <div className="admin-drill-catalog__field">
              <label htmlFor="create-name" className="admin-drill-catalog__label">
                Name *
              </label>
              <input
                id="create-name"
                type="text"
                className="admin-drill-catalog__input"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Drill name"
                required
              />
            </div>
            <div className="admin-drill-catalog__field">
              <label htmlFor="create-sport" className="admin-drill-catalog__label">
                Sport *
              </label>
              <select
                id="create-sport"
                className="admin-drill-catalog__select"
                value={createSport}
                onChange={(e) => setCreateSport(e.target.value as Sport)}
                required
              >
                {SUPPORTED_SPORTS.map((sport) => (
                  <option key={sport} value={sport}>
                    {SPORT_LABELS[sport]}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-drill-catalog__field">
              <label htmlFor="create-category" className="admin-drill-catalog__label">
                Category *
              </label>
              <select
                id="create-category"
                className="admin-drill-catalog__select"
                value={createCategory}
                onChange={(e) => setCreateCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                {DRILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-drill-catalog__field">
              <label htmlFor="create-video-url" className="admin-drill-catalog__label">
                Video URL
              </label>
              <input
                id="create-video-url"
                type="url"
                className="admin-drill-catalog__input"
                value={createVideoUrl}
                onChange={(e) => setCreateVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="admin-drill-catalog__field admin-drill-catalog__field--full">
              <label htmlFor="create-description" className="admin-drill-catalog__label">
                Description
              </label>
              <textarea
                id="create-description"
                className="admin-drill-catalog__textarea"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Drill description..."
                rows={3}
              />
            </div>
          </div>
          <div className="admin-drill-catalog__form-actions">
            <button type="submit" className="admin-drill-catalog__btn-primary">
              Create Drill
            </button>
            <button
              type="button"
              className="admin-drill-catalog__btn-secondary"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="admin-drill-catalog__filters">
        <select
          className="admin-drill-catalog__filter-select"
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value as Sport | '')}
          aria-label="Filter by sport"
        >
          <option value="">All Sports</option>
          {SUPPORTED_SPORTS.map((sport) => (
            <option key={sport} value={sport}>
              {SPORT_LABELS[sport]}
            </option>
          ))}
        </select>

        <select
          className="admin-drill-catalog__filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {DRILL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="admin-drill-catalog__search-input"
          placeholder="Search by name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search drills by name"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="admin-drill-catalog__loading">
          <div className="admin-drill-catalog__spinner" />
          <p>Loading drills...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && drills.length === 0 && (
        <div className="admin-drill-catalog__empty">
          <p>No drills found. {sportFilter || categoryFilter || searchInput ? 'Try adjusting your filters.' : 'Create your first drill to get started.'}</p>
        </div>
      )}

      {/* Drills Table */}
      {!loading && drills.length > 0 && (
        <div className="admin-drill-catalog__table-wrapper">
          <table className="admin-drill-catalog__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Sport</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drills.map((drill) => {
                const drillRecord = drill as unknown as DrillRecord;
                const isEditing = editingDrillId === drillRecord.id;

                if (isEditing) {
                  return (
                    <tr key={drillRecord.id} className="admin-drill-catalog__row admin-drill-catalog__row--editing">
                      <td colSpan={4}>
                        <form
                          className="admin-drill-catalog__inline-edit"
                          onSubmit={handleEditSubmit}
                          aria-label={`Edit drill: ${drillRecord.name}`}
                        >
                          <div className="admin-drill-catalog__edit-grid">
                            <div className="admin-drill-catalog__field">
                              <label htmlFor={`edit-name-${drillRecord.id}`} className="admin-drill-catalog__label">
                                Name *
                              </label>
                              <input
                                id={`edit-name-${drillRecord.id}`}
                                type="text"
                                className="admin-drill-catalog__input"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="admin-drill-catalog__field">
                              <label htmlFor={`edit-sport-${drillRecord.id}`} className="admin-drill-catalog__label">
                                Sport *
                              </label>
                              <select
                                id={`edit-sport-${drillRecord.id}`}
                                className="admin-drill-catalog__select"
                                value={editSport}
                                onChange={(e) => setEditSport(e.target.value as Sport)}
                                required
                              >
                                {SUPPORTED_SPORTS.map((sport) => (
                                  <option key={sport} value={sport}>
                                    {SPORT_LABELS[sport]}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="admin-drill-catalog__field">
                              <label htmlFor={`edit-category-${drillRecord.id}`} className="admin-drill-catalog__label">
                                Category *
                              </label>
                              <select
                                id={`edit-category-${drillRecord.id}`}
                                className="admin-drill-catalog__select"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                required
                              >
                                <option value="">Select category</option>
                                {DRILL_CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="admin-drill-catalog__field">
                              <label htmlFor={`edit-video-url-${drillRecord.id}`} className="admin-drill-catalog__label">
                                Video URL
                              </label>
                              <input
                                id={`edit-video-url-${drillRecord.id}`}
                                type="url"
                                className="admin-drill-catalog__input"
                                value={editVideoUrl}
                                onChange={(e) => setEditVideoUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                              />
                            </div>
                            <div className="admin-drill-catalog__field admin-drill-catalog__field--full">
                              <label htmlFor={`edit-description-${drillRecord.id}`} className="admin-drill-catalog__label">
                                Description
                              </label>
                              <textarea
                                id={`edit-description-${drillRecord.id}`}
                                className="admin-drill-catalog__textarea"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={2}
                              />
                            </div>
                          </div>
                          <div className="admin-drill-catalog__edit-actions">
                            <button type="submit" className="admin-drill-catalog__btn-primary">
                              Save
                            </button>
                            <button
                              type="button"
                              className="admin-drill-catalog__btn-secondary"
                              onClick={handleEditCancel}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={drillRecord.id} className="admin-drill-catalog__row">
                    <td className="admin-drill-catalog__cell-name">
                      <span className="admin-drill-catalog__drill-name">
                        {drillRecord.name}
                        {drillRecord.videoUrl && (
                          <span title="Has a demonstration video" aria-label="Has a demonstration video" style={{ marginLeft: 6 }}>🎬</span>
                        )}
                      </span>
                      {drillRecord.description && (
                        <span className="admin-drill-catalog__drill-desc">{drillRecord.description}</span>
                      )}
                    </td>
                    <td>{drillRecord.category}</td>
                    <td>{SPORT_LABELS[drillRecord.sport] || drillRecord.sport}</td>
                    <td className="admin-drill-catalog__cell-actions">
                      <button
                        className="admin-drill-catalog__btn-action"
                        onClick={() => handleEditStart(drillRecord)}
                        aria-label={`Edit ${drillRecord.name}`}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-drill-catalog__btn-action admin-drill-catalog__btn-action--danger"
                        onClick={() => handleArchive(drillRecord.id, drillRecord.name)}
                        aria-label={`Archive ${drillRecord.name}`}
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDrillCatalog;

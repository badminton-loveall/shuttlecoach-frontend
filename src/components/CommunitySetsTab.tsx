import React, { useState, useEffect } from 'react';
import type { DrillSet } from '../types';
import { useSetMarketplace } from '../hooks/useSetMarketplace';
import { SPORT_LABELS } from '../constants/sports';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * CommunitySetsTab Component
 * Browse published Drill Sets from other centers and adopt one (set +
 * categories + all its drills) into the coach's own center library.
 */

export const CommunitySetsTab: React.FC = () => {
  const { sets, loading, error, refetch, adoptSet } = useSetMarketplace();
  const [search, setSearch] = useState('');
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [adoptError, setAdoptError] = useState<string | null>(null);
  const [previewSet, setPreviewSet] = useState<DrillSet | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (adoptError) {
      const timer = setTimeout(() => setAdoptError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [adoptError]);

  const filtered = search
    ? sets.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : sets;

  const handleOpenPreview = async (set: DrillSet) => {
    setPreviewSet(set);
    setPreviewLoading(true);
    try {
      const response = await apiClient.get(`/drill-sets/marketplace/${set.id}`);
      setPreviewSet(response.data);
    } catch {
      setAdoptError('Failed to load set preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAdopt = async (set: DrillSet) => {
    setAdoptingId(set.id);
    setAdoptError(null);
    try {
      await adoptSet(set.id);
      setSuccessMessage(`"${set.name}" and its drills were added to your library.`);
      setPreviewSet(null);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setAdoptError(axiosErr.response?.data?.error || 'Failed to adopt set. Please try again.');
      } else {
        setAdoptError('Failed to adopt set. Please try again.');
      }
    } finally {
      setAdoptingId(null);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-[var(--text-secondary)]">Loading community sets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center py-8">
        <p className="text-[var(--color-error,#dc2626)] mb-4">{error}</p>
        <button onClick={refetch} className="btn btn-secondary">Retry</button>
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
      {adoptError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm">
          {adoptError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sets by name..."
          className="form-input text-sm flex-1"
          aria-label="Search community sets"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="table-filter-section">
          <div className="table-empty">
            No published sets available from other centers yet.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((set) => (
            <div key={set.id} className="card p-5 flex flex-col gap-3">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">{set.name}</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  by {set.coachName || 'a coach'} at {set.centerName || 'another center'}
                </p>
              </div>
              {set.description && (
                <p className="text-sm text-[var(--text-secondary)] line-clamp-3">{set.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span className="table-badge table-badge--success">{set.drillCount ?? 0} drills</span>
                {set.sport && (
                  <span className="table-badge table-badge--waived">
                    {SPORT_LABELS[set.sport as keyof typeof SPORT_LABELS] || set.sport}
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleOpenPreview(set)}
                  className="btn btn-secondary text-sm flex-1"
                >
                  Preview
                </button>
                <button
                  onClick={() => handleAdopt(set)}
                  disabled={adoptingId === set.id}
                  className="btn btn-primary text-sm flex-1"
                >
                  {adoptingId === set.id ? 'Adopting...' : 'Adopt'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewSet && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{previewSet.name}</h2>
              <button className="modal-close-btn" onClick={() => setPreviewSet(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                {previewSet.description || 'No description provided.'}
              </p>
              {previewLoading ? (
                <p className="text-sm text-[var(--text-secondary)]">Loading categories and drills...</p>
              ) : previewSet.categories && previewSet.categories.length > 0 ? (
                <div className="space-y-4">
                  {previewSet.categories.map((category) => (
                    <div key={category.id}>
                      <h4 className="font-semibold text-sm text-[var(--text-primary)] mb-1">{category.name}</h4>
                      {category.drills && category.drills.length > 0 ? (
                        <ul className="text-sm text-[var(--text-secondary)] space-y-1 pl-3">
                          {category.drills.map((drill) => (
                            <li key={drill.id}>{drill.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[var(--text-secondary)] pl-3">No drills</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No categories found in this set.</p>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setPreviewSet(null)} className="btn btn-secondary">Close</button>
              <button
                onClick={() => handleAdopt(previewSet)}
                disabled={adoptingId === previewSet.id}
                className="btn btn-primary"
              >
                {adoptingId === previewSet.id ? 'Adopting...' : `Adopt ${previewSet.drillCount ?? 0} Drills`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitySetsTab;

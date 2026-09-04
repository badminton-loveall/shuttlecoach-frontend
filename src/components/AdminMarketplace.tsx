import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Drill, DrillSet, DrillSetCategory, SetStatus, MarketplaceItem, DrillPackTier } from '../types';
import { useAdminDrills } from '../hooks/useAdminDrills';
import { SearchInput } from './SearchInput';
import { SPORT_LABELS } from '../constants/sports';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * AdminMarketplace Component
 *
 * The admin-side counterpart to the coach's Marketplace gallery: a card grid
 * of every drill_sets pack across every center and status, so the admin can
 * see the whole catalog at a glance. Clicking the official Badminton Drills
 * Pack opens an editable builder (admin owns that pack via the system
 * center); clicking any other pack opens a detail view — including
 * approve/reject when it's pending review, since this is the only
 * catalog-browsing page in the admin nav.
 *
 * Once a set is published, both modals also show its Packages — the priced,
 * one-time-purchase tiers (Standard / With Video) a center actually buys.
 * Pricing for recurring app plans (finance access, capacity) lives on the
 * separate Subscriptions page instead; this page owns everything about a
 * drill set's own lifecycle, content and commerce alike.
 */

type StatusFilter = SetStatus | 'all';
type OwnerFilter = 'all' | 'official';

const TIER_LABEL: Record<DrillPackTier, string> = {
  STANDARD: 'Standard',
  VIDEO_ENHANCED: 'With Video',
};

const ALL_TIERS: DrillPackTier[] = ['STANDARD', 'VIDEO_ENHANCED'];

const formatPackagePrice = (price: number): string =>
  price === 0
    ? 'Free'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

const getEmbedUrl = (url: string): string | null => {
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
};

const VIDEO_ICON_STYLE: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  border: 'none',
  background: 'var(--color-primary, #16a34a)',
  color: '#fff',
  fontSize: 9,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};

function extractErrorMessage(err: unknown, fallback: string): string {
  const message =
    err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
      : undefined;
  return message || fallback;
}

interface PackageFormState {
  name: string;
  description: string;
  price: string;
  durationDays: string;
}

/**
 * The priced-tier commerce panel for one drill set — lists its existing
 * marketplace_items packages and lets the admin add, edit, or
 * publish/unpublish them. Kept as its own component (rather than more state
 * on the parent) since it needs its own add/edit form state and is rendered
 * from two different parent modals.
 */
const PackagesSection: React.FC<{
  set: DrillSet;
  items: MarketplaceItem[];
  onChange: () => void;
}> = ({ set, items, onChange }) => {
  const [addingTier, setAddingTier] = useState<DrillPackTier | null>(null);
  const [addForm, setAddForm] = useState<PackageFormState>({ name: '', description: '', price: '0', durationDays: '' });
  const [addError, setAddError] = useState<string | null>(null);
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  const [editing, setEditing] = useState<MarketplaceItem | null>(null);
  const [editForm, setEditForm] = useState<PackageFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const usedTiers = new Set(items.map((item) => item.tier).filter(Boolean) as DrillPackTier[]);
  const availableTiers = ALL_TIERS.filter((tier) => !usedTiers.has(tier));

  const openAdd = (tier: DrillPackTier) => {
    setAddForm({ name: `${set.name} (${TIER_LABEL[tier]})`, description: '', price: '0', durationDays: '' });
    setAddError(null);
    setAddingTier(tier);
  };

  const handleAdd = async () => {
    if (!addingTier) return;
    if (!addForm.name.trim()) {
      setAddError('Name is required.');
      return;
    }
    const price = Number(addForm.price);
    if (Number.isNaN(price) || price < 0) {
      setAddError('Price must be zero or a positive number.');
      return;
    }
    setIsSavingAdd(true);
    setAddError(null);
    try {
      await apiClient.post('/admin/marketplace-items', {
        name: addForm.name.trim(),
        description: addForm.description.trim() || undefined,
        category: 'DRILL_PACK',
        drillSetId: set.id,
        tier: addingTier,
        price,
        durationDays: addForm.durationDays ? Number(addForm.durationDays) : undefined,
      });
      setAddingTier(null);
      onChange();
    } catch (err: unknown) {
      setAddError(extractErrorMessage(err, 'Failed to add package.'));
    } finally {
      setIsSavingAdd(false);
    }
  };

  const openEdit = (item: MarketplaceItem) => {
    setEditing(item);
    setEditForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      durationDays: item.durationDays ? String(item.durationDays) : '',
    });
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editing || !editForm) return;
    const price = Number(editForm.price);
    if (Number.isNaN(price) || price < 0) {
      setEditError('Price must be zero or a positive number.');
      return;
    }
    setIsSavingEdit(true);
    setEditError(null);
    try {
      await apiClient.patch(`/admin/marketplace-items/${editing.id}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        price,
        durationDays: editForm.durationDays ? Number(editForm.durationDays) : null,
      });
      setEditing(null);
      setEditForm(null);
      onChange();
    } catch (err: unknown) {
      setEditError(extractErrorMessage(err, 'Failed to update package.'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggle = async (item: MarketplaceItem) => {
    setTogglingId(item.id);
    setToggleError(null);
    try {
      await apiClient.patch(`/admin/marketplace-items/${item.id}`, { isEnabled: !item.isEnabled });
      onChange();
    } catch {
      setToggleError(`Failed to ${item.isEnabled ? 'unpublish' : 'publish'} "${item.name}".`);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
      <h4 className="font-semibold text-sm text-[var(--text-primary)] mb-2">Packages</h4>
      {toggleError && <p className="text-xs mb-2" style={{ color: 'var(--color-danger)' }}>{toggleError}</p>}

      {items.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)] mb-2">Not packaged for sale yet.</p>
      ) : (
        <ul className="space-y-2 mb-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm py-1">
              <div>
                <span className="text-bold">{item.tier ? TIER_LABEL[item.tier] : item.name}</span>{' '}
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formatPackagePrice(item.price)} · {item.durationDays ? `${item.durationDays} days` : 'Lifetime'}
                </span>
                <span
                  className={`table-badge ${item.isEnabled ? 'table-badge--success' : 'table-badge--overdue'}`}
                  style={{ marginLeft: 8 }}
                >
                  {item.isEnabled ? 'Published' : 'Unpublished'}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="table-action-link text-xs" onClick={() => openEdit(item)}>
                  Edit
                </button>
                <button
                  className={`table-action-link text-xs ${item.isEnabled ? 'table-action-link--danger' : ''}`}
                  onClick={() => handleToggle(item)}
                  disabled={togglingId === item.id}
                >
                  {item.isEnabled ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {set.status === 'published' && availableTiers.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {availableTiers.map((tier) => (
            <button key={tier} className="btn btn-secondary text-xs" onClick={() => openAdd(tier)}>
              + Add {TIER_LABEL[tier]} Package
            </button>
          ))}
        </div>
      )}

      {addingTier && (
        <div className="card-base p-3 mt-2 space-y-2">
          {addError && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{addError}</p>}
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input text-sm"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={150}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input text-sm"
              rows={2}
              value={addForm.description}
              onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Price (₹, one-time)</label>
            <input
              className="form-input text-sm"
              type="number"
              min={0}
              value={addForm.price}
              onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Auto-expires after (days, optional)</label>
            <input
              className="form-input text-sm"
              type="number"
              min={1}
              value={addForm.durationDays}
              onChange={(e) => setAddForm((f) => ({ ...f, durationDays: e.target.value }))}
              placeholder="Leave blank for lifetime access"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn btn-secondary text-xs" onClick={() => setAddingTier(null)} disabled={isSavingAdd}>
              Cancel
            </button>
            <button className="btn btn-primary text-xs" onClick={handleAdd} disabled={isSavingAdd}>
              {isSavingAdd ? 'Adding...' : 'Add Package'}
            </button>
          </div>
        </div>
      )}

      {editing && editForm && (
        <div className="card-base p-3 mt-2 space-y-2">
          {editError && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{editError}</p>}
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input text-sm"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => (f ? { ...f, name: e.target.value } : f))}
              maxLength={150}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input text-sm"
              rows={2}
              value={editForm.description}
              onChange={(e) => setEditForm((f) => (f ? { ...f, description: e.target.value } : f))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Price (₹, one-time)</label>
            <input
              className="form-input text-sm"
              type="number"
              min={0}
              value={editForm.price}
              onChange={(e) => setEditForm((f) => (f ? { ...f, price: e.target.value } : f))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Auto-expires after (days, optional)</label>
            <input
              className="form-input text-sm"
              type="number"
              min={1}
              value={editForm.durationDays}
              onChange={(e) => setEditForm((f) => (f ? { ...f, durationDays: e.target.value } : f))}
              placeholder="Leave blank for lifetime access"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              className="btn btn-secondary text-xs"
              onClick={() => {
                setEditing(null);
                setEditForm(null);
              }}
              disabled={isSavingEdit}
            >
              Cancel
            </button>
            <button className="btn btn-primary text-xs" onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const STATUS_BADGE_CLASS: Record<SetStatus, string> = {
  draft: 'table-badge--waived',
  pending_review: 'table-badge--pending',
  published: 'table-badge--success',
  rejected: 'table-badge--overdue',
};

const STATUS_LABEL: Record<SetStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  rejected: 'Rejected',
};

export const AdminMarketplace: React.FC = () => {
  const [sets, setSets] = useState<DrillSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [search, setSearch] = useState('');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Demonstration clip modal — shared by both the pack builder and the
  // read-only detail view, since both list a set's drills.
  const [viewingVideo, setViewingVideo] = useState<{ name: string; url: string } | null>(null);

  // Priced packages (marketplace_items, category=DRILL_PACK), keyed by drillSetId
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);

  // Detail modal (non-official packs) — includes approve/reject when pending
  const [viewing, setViewing] = useState<DrillSet | null>(null);
  const [viewCategories, setViewCategories] = useState<DrillSetCategory[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Official pack builder modal
  const [building, setBuilding] = useState<DrillSet | null>(null);
  const [buildCategories, setBuildCategories] = useState<DrillSetCategory[]>([]);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addDrillSelections, setAddDrillSelections] = useState<Record<string, string>>({});

  const { drills: globalDrills } = useAdminDrills();

  const fetchSets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/admin/drill-sets', {
        params: { status: statusFilter },
      });
      setSets(response.data.sets);
    } catch {
      setError('Failed to load the marketplace catalog.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchMarketplaceItems = useCallback(async () => {
    try {
      const response = await apiClient.get<MarketplaceItem[]>('/admin/marketplace-items', {
        params: { category: 'DRILL_PACK' },
      });
      setMarketplaceItems(response.data);
    } catch {
      // Non-fatal — the pack catalog still loads; packages just won't show.
    }
  }, []);

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  useEffect(() => {
    fetchMarketplaceItems();
  }, [fetchMarketplaceItems]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const visibleSets = sets.filter((set) => {
    if (ownerFilter === 'official' && !set.isOfficial) return false;
    if (search && !set.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const officialCount = sets.filter((s) => s.isOfficial).length;

  const itemsBySetId = useMemo(() => {
    const map = new Map<string, MarketplaceItem[]>();
    for (const item of marketplaceItems) {
      if (!item.drillSetId) continue;
      const list = map.get(item.drillSetId) || [];
      list.push(item);
      map.set(item.drillSetId, list);
    }
    return map;
  }, [marketplaceItems]);

  // --- Detail view (non-official) ---
  const handleOpenView = async (set: DrillSet) => {
    setViewing(set);
    setShowRejectForm(false);
    setRejectReason('');
    setViewLoading(true);
    try {
      const response = await apiClient.get(`/admin/drill-sets/${set.id}`);
      setViewCategories(response.data.categories || []);
    } catch {
      setViewCategories([]);
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseView = () => {
    setViewing(null);
    setViewCategories([]);
    setShowRejectForm(false);
    setRejectReason('');
  };

  const handleApprove = async () => {
    if (!viewing) return;
    setReviewActionLoading(true);
    try {
      await apiClient.post(`/admin/drill-sets/${viewing.id}/approve`);
      setSuccessMessage(`"${viewing.name}" published to the marketplace.`);
      handleCloseView();
      await fetchSets();
    } catch {
      setError('Failed to approve set.');
    } finally {
      setReviewActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!viewing) return;
    setReviewActionLoading(true);
    try {
      await apiClient.post(`/admin/drill-sets/${viewing.id}/reject`, {
        reason: rejectReason.trim() || undefined,
      });
      setSuccessMessage(`"${viewing.name}" rejected.`);
      handleCloseView();
      await fetchSets();
    } catch {
      setError('Failed to reject set.');
    } finally {
      setReviewActionLoading(false);
    }
  };

  const handleResetToDraft = async () => {
    if (!viewing) return;
    if (
      !window.confirm(
        `Reset "${viewing.name}" to draft? It will be pulled from the marketplace and any packages will be unpublished.`
      )
    ) {
      return;
    }
    setResetLoading(true);
    try {
      await apiClient.post(`/admin/drill-sets/${viewing.id}/reset-to-draft`);
      setSuccessMessage(`"${viewing.name}" reset to draft.`);
      handleCloseView();
      await fetchSets();
      await fetchMarketplaceItems();
    } catch {
      setError('Failed to reset set to draft.');
    } finally {
      setResetLoading(false);
    }
  };

  // --- Official pack builder ---
  const loadBuildDetail = useCallback(async (set: DrillSet) => {
    setBuildLoading(true);
    setBuildError(null);
    try {
      const response = await apiClient.get(`/admin/drill-sets/${set.id}`);
      setBuildCategories(response.data.categories || []);
    } catch {
      setBuildError('Failed to load this pack.');
    } finally {
      setBuildLoading(false);
    }
  }, []);

  const handleOpenBuild = async (set: DrillSet) => {
    setBuilding(set);
    setNewCategoryName('');
    setAddDrillSelections({});
    await loadBuildDetail(set);
  };

  const handleCloseBuild = async () => {
    setBuilding(null);
    setBuildCategories([]);
    setBuildError(null);
    await fetchSets();
  };

  const handleAddCategory = async () => {
    if (!building || !newCategoryName.trim()) return;
    setBuildError(null);
    try {
      await apiClient.post(`/admin/drill-sets/${building.id}/categories`, { name: newCategoryName.trim() });
      setNewCategoryName('');
      setSuccessMessage('Category added');
      await loadBuildDetail(building);
    } catch {
      setBuildError('Failed to add category.');
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    if (!building) return;
    setBuildError(null);
    try {
      await apiClient.delete(`/admin/drill-sets/${building.id}/categories/${categoryId}`);
      await loadBuildDetail(building);
    } catch {
      setBuildError('Failed to remove category.');
    }
  };

  const handleAddDrill = async (categoryId: string) => {
    const drillId = addDrillSelections[categoryId];
    if (!building || !drillId) return;
    setBuildError(null);
    try {
      await apiClient.post(`/admin/drill-sets/${building.id}/categories/${categoryId}/drills`, { drillId });
      setAddDrillSelections((prev) => ({ ...prev, [categoryId]: '' }));
      await loadBuildDetail(building);
    } catch {
      setBuildError('Failed to add drill.');
    }
  };

  const handleRemoveDrill = async (categoryId: string, drillId: string) => {
    if (!building) return;
    setBuildError(null);
    try {
      await apiClient.delete(`/admin/drill-sets/${building.id}/categories/${categoryId}/drills/${drillId}`);
      await loadBuildDetail(building);
    } catch {
      setBuildError('Failed to remove drill.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Marketplace</h1>
        <p className="admin-page-subtitle">
          Every pack across every center — browse the full catalog and manage the Badminton Drills Pack directly.
        </p>
      </div>

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSets} className="btn btn-secondary text-xs ml-2">Retry</button>
        </div>
      )}

      <div className="marketplace-toolbar">
        <div className="marketplace-toolbar__filters">
          <button
            type="button"
            onClick={() => setOwnerFilter('all')}
            className={`badge-base ${ownerFilter === 'all' ? 'badge-primary' : 'badge-outline'}`}
            style={{ cursor: 'pointer', fontFamily: 'inherit', border: ownerFilter === 'all' ? '1px solid transparent' : undefined }}
          >
            All ({sets.length})
          </button>
          <button
            type="button"
            onClick={() => setOwnerFilter('official')}
            className={`badge-base ${ownerFilter === 'official' ? 'badge-primary' : 'badge-outline'}`}
            style={{ cursor: 'pointer', fontFamily: 'inherit', border: ownerFilter === 'official' ? '1px solid transparent' : undefined }}
          >
            Official ({officialCount})
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="form-input text-sm"
            style={{ width: 'auto' }}
            aria-label="Filter by status"
          >
            <option value="all">Any status</option>
            <option value="pending_review">Pending Review</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div className="marketplace-toolbar__search">
          <SearchInput value={search} onChange={setSearch} placeholder="Search packs..." />
        </div>
      </div>

      {loading ? (
        <div className="card p-6 text-center text-[var(--text-secondary)]">Loading catalog...</div>
      ) : visibleSets.length === 0 ? (
        <div className="table-filter-section">
          <div className="table-empty">No packs match these filters</div>
        </div>
      ) : (
        <div className="marketplace-grid">
          {visibleSets.map((set) => (
            <div
              key={set.id}
              className="card-base card-hover flex flex-col gap-2"
              onClick={() => (set.isOfficial ? handleOpenBuild(set) : handleOpenView(set))}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  set.isOfficial ? handleOpenBuild(set) : handleOpenView(set);
                }
              }}
            >
              <div className="card-header" style={{ marginBottom: 'var(--space-sm)' }}>
                <div className="flex flex-wrap gap-1" style={{ marginBottom: 'var(--space-xs)' }}>
                  {set.isOfficial && <span className="badge-base badge-primary">Official</span>}
                  <span className={`table-badge ${STATUS_BADGE_CLASS[set.status]}`}>
                    {STATUS_LABEL[set.status]}
                  </span>
                  {set.sport && (
                    <span className="badge-base badge-secondary">
                      {SPORT_LABELS[set.sport as keyof typeof SPORT_LABELS] || set.sport}
                    </span>
                  )}
                </div>
                <h3 className="card-title">{set.name}</h3>
                <p className="card-description" style={{ marginTop: '-4px' }}>
                  by {set.coachName || 'a coach'} · {set.centerName || 'a center'}
                </p>
              </div>

              <p className="card-description" style={{ flex: 1 }}>
                {set.description || 'No description provided.'}
              </p>

              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {(set.drillCount ?? 0)} drill{(set.drillCount ?? 0) === 1 ? '' : 's'}
              </div>

              <div className="card-footer" style={{ marginTop: 'var(--space-sm)' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    set.isOfficial ? handleOpenBuild(set) : handleOpenView(set);
                  }}
                  className="btn btn-secondary text-sm w-full"
                >
                  {set.isOfficial ? 'Manage' : 'View'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel (non-official packs) — approve/reject when pending_review */}
      {viewing && (
        <div className="side-panel-overlay" onClick={handleCloseView}>
          <div className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{viewing.name}</h2>
              <button className="modal-close-btn" onClick={handleCloseView}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                Submitted by {viewing.coachName || 'a coach'} at {viewing.centerName || 'a center'}
              </p>
              {viewing.description && (
                <p className="text-sm text-[var(--text-secondary)] mb-3">{viewing.description}</p>
              )}

              {viewLoading ? (
                <p className="text-sm text-[var(--text-secondary)]">Loading categories and drills...</p>
              ) : viewCategories.length > 0 ? (
                <div className="space-y-4">
                  {viewCategories.map((category) => (
                    <div key={category.id}>
                      <h4 className="font-semibold text-sm text-[var(--text-primary)] mb-1">{category.name}</h4>
                      {category.drills && category.drills.length > 0 ? (
                        <div className="table-container">
                          <table className="table-styled">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {category.drills.map((drill) => (
                                <tr key={drill.id}>
                                  <td className="text-bold">
                                    <span className="flex items-center justify-between gap-2">
                                      <span>{drill.name}</span>
                                      {drill.videoUrl && (
                                        <button
                                          type="button"
                                          onClick={() => setViewingVideo({ name: drill.name, url: drill.videoUrl! })}
                                          aria-label={`Watch demonstration: ${drill.name}`}
                                          title="Watch demonstration"
                                          style={VIDEO_ICON_STYLE}
                                        >
                                          ▶
                                        </button>
                                      )}
                                    </span>
                                  </td>
                                  <td>{drill.category}</td>
                                  <td className="text-muted">{drill.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--text-secondary)]">No drills</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No categories found in this set.</p>
              )}

              {!viewLoading && (
                <PackagesSection
                  set={viewing}
                  items={itemsBySetId.get(viewing.id) || []}
                  onChange={fetchMarketplaceItems}
                />
              )}

              {showRejectForm && (
                <div className="form-group mt-3">
                  <label htmlFor="admin-reject-reason" className="form-label">Rejection reason (optional)</label>
                  <textarea
                    id="admin-reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Let the coach know why this was rejected"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseView} className="btn btn-secondary">Close</button>
              {(viewing.status === 'published' || viewing.status === 'rejected') && !showRejectForm && (
                <button onClick={handleResetToDraft} disabled={resetLoading} className="btn btn-secondary">
                  {resetLoading ? 'Resetting...' : 'Reset to Draft'}
                </button>
              )}
              {viewing.status === 'pending_review' && !showRejectForm && (
                <>
                  <button onClick={() => setShowRejectForm(true)} className="btn btn-danger">
                    Reject
                  </button>
                  <button onClick={handleApprove} disabled={reviewActionLoading} className="btn btn-primary">
                    {reviewActionLoading ? 'Approving...' : 'Approve & Publish'}
                  </button>
                </>
              )}
              {showRejectForm && (
                <button onClick={handleReject} disabled={reviewActionLoading} className="btn btn-danger">
                  {reviewActionLoading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official pack builder panel */}
      {building && (
        <div className="side-panel-overlay" onClick={() => { void handleCloseBuild(); }}>
          <div className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{building.name}</h2>
              <button className="modal-close-btn" onClick={handleCloseBuild}>✕</button>
            </div>
            <div className="modal-body">
              {buildError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm mb-3">
                  {buildError}
                </div>
              )}

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

              {buildLoading ? (
                <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
              ) : buildCategories.length === 0 ? (
                <div className="table-empty">No categories yet — add one above, then add drills under it.</div>
              ) : (
                <div className="space-y-4">
                  {buildCategories.map((category) => {
                    const categoryDrillIds = new Set((category.drills || []).map((d) => d.id));
                    const eligibleDrills = globalDrills.filter((d: Drill) => !categoryDrillIds.has(d.id));
                    return (
                      <div key={category.id} className="card-base">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-[var(--text-primary)]">{category.name}</h4>
                          <button
                            onClick={() => handleRemoveCategory(category.id)}
                            className="table-action-link table-action-link--danger text-xs"
                          >
                            Remove Category
                          </button>
                        </div>

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

                        {category.drills && category.drills.length > 0 ? (
                          <ul className="space-y-1">
                            {category.drills.map((drill) => (
                              <li key={drill.id} className="flex items-center justify-between text-sm py-1">
                                <span>{drill.name}</span>
                                <span className="flex items-center gap-2">
                                  {drill.videoUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setViewingVideo({ name: drill.name, url: drill.videoUrl! })}
                                      aria-label={`Watch demonstration: ${drill.name}`}
                                      title="Watch demonstration"
                                      style={VIDEO_ICON_STYLE}
                                    >
                                      ▶
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemoveDrill(category.id, drill.id)}
                                    className="table-action-link table-action-link--danger text-xs"
                                  >
                                    Remove
                                  </button>
                                </span>
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

              {!buildLoading && (
                <PackagesSection
                  set={building}
                  items={itemsBySetId.get(building.id) || []}
                  onChange={fetchMarketplaceItems}
                />
              )}
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseBuild} className="btn btn-secondary">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Demonstration clip modal */}
      {viewingVideo && (
        <div className="modal-overlay" onClick={() => setViewingVideo(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 className="modal-title">{viewingVideo.name}</h2>
              <button className="modal-close-btn" onClick={() => setViewingVideo(null)}>✕</button>
            </div>
            <div className="modal-body">
              {getEmbedUrl(viewingVideo.url) ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={getEmbedUrl(viewingVideo.url)!}
                    title={viewingVideo.name}
                    allow="autoplay; fullscreen"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  />
                </div>
              ) : (
                <p className="text-sm">
                  <a href={viewingVideo.url} target="_blank" rel="noreferrer">Open demonstration video</a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMarketplace;

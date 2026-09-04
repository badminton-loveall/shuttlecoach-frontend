import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Drill, DrillSet, DrillSetCategory, MarketplaceItem, CenterSubscription } from '../types';
import { useDrillSets } from '../hooks/useDrillSets';
import { useSetMarketplace } from '../hooks/useSetMarketplace';
import { useDrills } from '../hooks/useDrills';
import { SearchInput } from './SearchInput';
import { PackEnabledToggle } from './PackEnabledToggle';
import { SPORT_LABELS, SUPPORTED_SPORTS } from '../constants/sports';
import apiClient from '../utils/apiClient';
import { getTrialInfo, formatTrialLabel } from '../utils/subscriptionUtils';
import '../styles/pages.css';

/**
 * MarketplaceGallery Component
 *
 * A single, unified listing surface for the Marketplace tab — modeled on
 * template-marketplace UX (n8n, Make): one searchable, filterable grid where
 * every listing — the admin-curated Badminton Drills Pack, the coach's own
 * Drill Sets at every stage, and published sets from other centers — is
 * itself a drill_sets row and appears as a card with a clear ownership/
 * status badge. "+ Add Drills" starts a new set right from the gallery.
 */

type OwnerKind = 'mine' | 'community';
type FilterKind = 'all' | 'official' | OwnerKind;

interface GalleryItem {
  id: string;
  owner: OwnerKind;
  isOfficial: boolean;
  title: string;
  description: string;
  sport?: string | null;
  drillCount: number;
  status?: DrillSet['status'];
  centerName?: string;
  coachName?: string;
  rejectionReason?: string | null;
  set: DrillSet;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-secondary',
  pending_review: 'badge-warning',
  published: 'badge-success',
  rejected: 'badge-danger',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  rejected: 'Rejected',
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

interface SetFormData {
  name: string;
  description: string;
  sport: string;
}

const emptyFormData: SetFormData = { name: '', description: '', sport: '' };

export const MarketplaceGallery: React.FC = () => {
  // --- My sets ---
  const {
    sets: mySets,
    loading: mineLoading,
    refetch: refetchMine,
    createSet,
    updateSet,
    deleteSet,
    getSetDetail,
    createSetCategory,
    deleteSetCategory,
    addDrillToSetCategory,
    removeDrillFromSetCategory,
    submitSet,
    toggleEnabled,
  } = useDrillSets();

  // --- Community sets (also where the official pack appears until adopted) ---
  const {
    sets: communitySets,
    loading: communityLoading,
    adoptSet,
  } = useSetMarketplace();

  const { drills: centerDrills } = useDrills();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKind>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create/Edit set details
  const [showForm, setShowForm] = useState(false);
  const [editingSet, setEditingSet] = useState<DrillSet | null>(null);
  const [formData, setFormData] = useState<SetFormData>(emptyFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);

  // Delete confirmation
  const [deletingSet, setDeletingSet] = useState<DrillSet | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Builder / viewer modal for a "mine" set
  const [openSet, setOpenSet] = useState<DrillSet | null>(null);
  const [openCategories, setOpenCategories] = useState<DrillSetCategory[]>([]);
  const [openLoading, setOpenLoading] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addDrillSelections, setAddDrillSelections] = useState<Record<string, string>>({});
  const [submitTargetId, setSubmitTargetId] = useState<string | null>(null);

  // Community preview / adopt
  const [previewSet, setPreviewSet] = useState<DrillSet | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);

  // Demonstration clips — resolved per set, keyed by drillId. Empty unless the
  // center holds an active Video-Enhanced subscription for this set (and, for
  // a STUDENT viewer, the center has also turned student access on).
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [viewingVideo, setViewingVideo] = useState<{ name: string; url: string } | null>(null);

  const loadVideoUrls = async (setId: string) => {
    try {
      const response = await apiClient.get<Record<string, string>>(`/marketplace/drill-sets/${setId}/video-urls`);
      setVideoUrls(response.data || {});
    } catch {
      setVideoUrls({});
    }
  };

  // Drill packs are a one-time purchase, priced by admin — fetched once so
  // any set's card/preview can show "Free" / a price / Owned / Requested.
  const [drillPackCatalog, setDrillPackCatalog] = useState<MarketplaceItem[]>([]);
  const [myDrillPacks, setMyDrillPacks] = useState<CenterSubscription[]>([]);
  const [myDrillPackRequests, setMyDrillPackRequests] = useState<CenterSubscription[]>([]);
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);

  const loadDrillPackPricing = useCallback(async () => {
    try {
      const [catalogRes, subsRes, requestsRes] = await Promise.all([
        apiClient.get<MarketplaceItem[]>('/marketplace/items'),
        apiClient.get<CenterSubscription[]>('/marketplace/my-subscriptions'),
        apiClient.get<CenterSubscription[]>('/marketplace/my-requests'),
      ]);
      setDrillPackCatalog(catalogRes.data.filter((item) => item.category === 'DRILL_PACK'));
      setMyDrillPacks(subsRes.data.filter((sub) => sub.itemCategory === 'DRILL_PACK'));
      setMyDrillPackRequests(requestsRes.data.filter((req) => req.itemCategory === 'DRILL_PACK'));
    } catch {
      // Pricing is a bonus on top of the free adopt flow — fail quietly.
    }
  }, []);

  useEffect(() => {
    void loadDrillPackPricing();
  }, [loadDrillPackPricing]);

  const formatDrillPackPrice = (price: number): string =>
    price === 0
      ? 'Free'
      : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
          price
        );

  const handleBuyDrillPack = async (item: MarketplaceItem) => {
    setBuyingItemId(item.id);
    setErrorMessage(null);
    try {
      const response = await apiClient.post<{ autoActivated: boolean }>('/marketplace/subscribe', {
        marketplaceItemId: item.id,
      });
      setSuccessMessage(
        response.data.autoActivated
          ? `"${item.name}" is yours now.`
          : `Request sent for "${item.name}" — your admin will review it.`
      );
      await loadDrillPackPricing();
    } catch (err) {
      setErrorMessage(extractError(err, 'Failed to buy this pack.'));
    } finally {
      setBuyingItemId(null);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const extractError = (err: unknown, fallback: string): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      return axiosErr.response?.data?.error || fallback;
    }
    return fallback;
  };

  // Converts a plain YouTube/Vimeo watch URL into its embeddable form so the
  // clip plays inline; anything else falls back to a direct link.
  const getEmbedUrl = (url: string): string | null => {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  };

  // --- Build the unified item list ---
  const items: GalleryItem[] = useMemo(() => {
    const list: GalleryItem[] = [];

    for (const set of mySets) {
      list.push({
        id: `mine-${set.id}`,
        owner: 'mine',
        isOfficial: set.isOfficial,
        title: set.name,
        description: set.description || 'No description yet.',
        sport: set.sport,
        drillCount: set.drillCount ?? 0,
        status: set.status,
        rejectionReason: set.rejectionReason,
        set,
      });
    }

    for (const set of communitySets) {
      list.push({
        id: `community-${set.id}`,
        owner: 'community',
        isOfficial: set.isOfficial,
        title: set.name,
        description: set.description || 'No description provided.',
        sport: set.sport,
        drillCount: set.drillCount ?? 0,
        centerName: set.centerName,
        coachName: set.coachName,
        set,
      });
    }

    list.sort((a, b) => Number(b.isOfficial) - Number(a.isOfficial));
    return list;
  }, [mySets, communitySets]);

  const counts = useMemo(
    () => ({
      all: items.length,
      official: items.filter((i) => i.isOfficial).length,
      mine: items.filter((i) => i.owner === 'mine').length,
      community: items.filter((i) => i.owner === 'community' && !i.isOfficial).length,
    }),
    [items]
  );

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (filter === 'official' && !item.isOfficial) return false;
      if (filter === 'mine' && item.owner !== 'mine') return false;
      if (filter === 'community' && (item.owner !== 'community' || item.isOfficial)) return false;
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, filter, search]);

  const handleToggleMineSet = async (setId: string, next: boolean) => {
    try {
      await toggleEnabled(setId, next);
    } catch (err) {
      setErrorMessage(extractError(err, 'Failed to update this set.'));
    }
  };

  // --- Create / edit set details ---
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
    setSavingForm(true);
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
      setSavingForm(false);
    }
  };

  // --- Delete ---
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

  // --- Builder / viewer ---
  const loadOpenDetail = useCallback(async (set: DrillSet) => {
    setOpenLoading(true);
    setOpenError(null);
    try {
      const detail = await getSetDetail(set.id);
      setOpenCategories(detail.categories || []);
    } catch {
      setOpenError('Failed to load this set.');
    } finally {
      setOpenLoading(false);
    }
  }, [getSetDetail]);

  const handleOpenBuilder = async (set: DrillSet) => {
    setOpenSet(set);
    setNewCategoryName('');
    setAddDrillSelections({});
    setVideoUrls({});
    await Promise.all([loadOpenDetail(set), loadVideoUrls(set.id)]);
  };

  const handleCloseBuilder = async () => {
    setOpenSet(null);
    setOpenCategories([]);
    setOpenError(null);
    setVideoUrls({});
    await refetchMine();
  };

  const handleAddCategory = async () => {
    if (!openSet || !newCategoryName.trim()) return;
    setOpenError(null);
    try {
      await createSetCategory(openSet.id, newCategoryName.trim());
      setNewCategoryName('');
      await loadOpenDetail(openSet);
    } catch {
      setOpenError('Failed to add category.');
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    if (!openSet) return;
    setOpenError(null);
    try {
      await deleteSetCategory(openSet.id, categoryId);
      await loadOpenDetail(openSet);
    } catch {
      setOpenError('Failed to remove category.');
    }
  };

  const handleAddDrill = async (categoryId: string) => {
    const drillId = addDrillSelections[categoryId];
    if (!openSet || !drillId) return;
    setOpenError(null);
    try {
      await addDrillToSetCategory(openSet.id, categoryId, drillId);
      setAddDrillSelections((prev) => ({ ...prev, [categoryId]: '' }));
      await loadOpenDetail(openSet);
    } catch (err) {
      setOpenError(extractError(err, 'Failed to add drill.'));
    }
  };

  const handleRemoveDrill = async (categoryId: string, drillId: string) => {
    if (!openSet) return;
    setOpenError(null);
    try {
      await removeDrillFromSetCategory(openSet.id, categoryId, drillId);
      await loadOpenDetail(openSet);
    } catch {
      setOpenError('Failed to remove drill.');
    }
  };

  const handleSubmitSet = async (set: DrillSet) => {
    setSubmitTargetId(set.id);
    try {
      await submitSet(set.id);
      setSuccessMessage('Set submitted for review');
      if (openSet?.id === set.id) {
        await handleCloseBuilder();
      }
    } catch (err) {
      setErrorMessage(extractError(err, 'Failed to submit set.'));
    } finally {
      setSubmitTargetId(null);
    }
  };

  // --- Community preview / adopt ---
  const handleOpenPreview = async (set: DrillSet) => {
    setPreviewSet(set);
    setPreviewLoading(true);
    setVideoUrls({});
    try {
      const response = await apiClient.get(`/drill-sets/marketplace/${set.id}`);
      setPreviewSet(response.data);
      await loadVideoUrls(set.id);
    } catch {
      setErrorMessage('Failed to load set preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAdoptCommunity = async (set: DrillSet) => {
    setAdoptingId(set.id);
    setErrorMessage(null);
    try {
      await adoptSet(set.id);
      setSuccessMessage(`"${set.name}" and its drills were added to your library.`);
      setPreviewSet(null);
    } catch (err) {
      setErrorMessage(extractError(err, 'Failed to adopt set. Please try again.'));
    } finally {
      setAdoptingId(null);
    }
  };

  const totalOpenDrills = openCategories.reduce((sum, c) => sum + (c.drills?.length || 0), 0);
  const isLoading = mineLoading && communityLoading;

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="marketplace-page-header">
        <div>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Marketplace</h2>
          <p className="card-description">
            Browse the Badminton Drills Pack, build your own sets, and adopt sets shared by other centers.
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary text-sm whitespace-nowrap">
          + Add Drills
        </button>
      </div>

      {/* Filter chips + search */}
      <div className="marketplace-toolbar">
        <div className="marketplace-toolbar__filters">
          {(['all', 'official', 'mine', 'community'] as FilterKind[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`badge-base ${filter === key ? 'badge-primary' : 'badge-outline'}`}
              style={{ cursor: 'pointer', fontFamily: 'inherit', border: filter === key ? '1px solid transparent' : undefined }}
            >
              {key === 'all' ? 'All' : key === 'official' ? 'Official' : key === 'mine' ? 'Mine' : 'Community'}
              {' '}({counts[key]})
            </button>
          ))}
        </div>
        <div className="marketplace-toolbar__search">
          <SearchInput value={search} onChange={setSearch} placeholder="Search the marketplace..." />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="card-base p-6 text-center text-[var(--text-secondary)]">Loading marketplace...</div>
      ) : visibleItems.length === 0 ? (
        <div className="card-base p-6 text-center text-[var(--text-secondary)]">
          Nothing here yet{search ? ' matching your search' : ''}.
        </div>
      ) : (
        <div className="marketplace-grid">
          {visibleItems.map((item) => (
            <div key={item.id} className="card-base card-hover flex flex-col gap-2">
              <div className="card-header" style={{ marginBottom: 'var(--space-sm)' }}>
                <div className="flex flex-wrap gap-1" style={{ marginBottom: 'var(--space-xs)' }}>
                  {item.isOfficial ? (
                    <span className="badge-base badge-primary">Official</span>
                  ) : item.owner === 'mine' ? (
                    <span className="badge-base badge-outline">Yours</span>
                  ) : (
                    <span className="badge-base badge-info">Community</span>
                  )}
                  {item.owner === 'mine' && item.status && (
                    <span className={`badge-base ${STATUS_BADGE[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  )}
                  {item.sport && (
                    <span className="badge-base badge-secondary">
                      {SPORT_LABELS[item.sport as keyof typeof SPORT_LABELS] || item.sport}
                    </span>
                  )}
                </div>
                <h3 className="card-title">{item.title}</h3>
                {item.owner === 'community' && !item.isOfficial && (
                  <p className="card-description" style={{ marginTop: '-4px' }}>
                    by {item.coachName || 'a coach'} · {item.centerName || 'another center'}
                  </p>
                )}
              </div>

              <p className="card-description" style={{ flex: 1 }}>{item.description}</p>

              {item.owner === 'mine' && item.status === 'rejected' && item.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-xs">
                  Rejected: {item.rejectionReason}
                </div>
              )}

              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {item.drillCount} drill{item.drillCount === 1 ? '' : 's'}
              </div>

              <div className="card-footer" style={{ marginTop: 'var(--space-sm)' }}>
                {item.owner === 'mine' && (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex gap-2 w-full flex-wrap">
                      <button
                        onClick={() => handleOpenBuilder(item.set)}
                        className="btn btn-secondary text-sm flex-1"
                      >
                        {item.status === 'draft' || item.status === 'rejected' ? 'Manage' : 'View'}
                      </button>
                      {(item.status === 'draft' || item.status === 'rejected') && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(item.set)}
                            className="table-action-link table-action-link--info"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingSet(item.set)}
                            className="table-action-link table-action-link--danger"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {item.set.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <PackEnabledToggle
                        checked={item.set.isEnabled}
                        onChange={(next) => handleToggleMineSet(item.set.id, next)}
                      />
                    </div>
                  </div>
                )}

                {item.owner === 'community' && (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleOpenPreview(item.set)}
                      className="btn btn-secondary text-sm flex-1"
                    >
                      Preview
                    </button>
                    {/* A priced set is only acquired through its tier's own
                        Subscribe button in the preview panel — no free
                        one-click bypass once the admin has put a price on it. */}
                    {!drillPackCatalog.some((mi) => mi.drillSetId === item.set.id) && (
                      <button
                        onClick={() => handleAdoptCommunity(item.set)}
                        disabled={adoptingId === item.set.id}
                        className="btn btn-primary text-sm flex-1"
                      >
                        {adoptingId === item.set.id ? 'Subscribing...' : 'Subscribe'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
                <button type="submit" disabled={savingForm} className="btn btn-primary">
                  {savingForm ? 'Saving...' : editingSet ? 'Save Changes' : 'Create & Add Drills'}
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

      {/* Builder / Viewer Panel */}
      {openSet && (
        <div className="side-panel-overlay" onClick={handleCloseBuilder}>
          <div className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{openSet.name}</h2>
              <button className="modal-close-btn" onClick={handleCloseBuilder}>✕</button>
            </div>
            <div className="modal-body">
              {openError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm mb-3">
                  {openError}
                </div>
              )}

              {(openSet.status === 'draft' || openSet.status === 'rejected') && (
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

              {openLoading ? (
                <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
              ) : openCategories.length === 0 ? (
                <div className="table-empty">No categories yet — add one above, then add drills under it.</div>
              ) : (
                <div className="space-y-4">
                  {openCategories.map((category) => {
                    const editable = openSet.status === 'draft' || openSet.status === 'rejected';
                    const categoryDrillIds = new Set((category.drills || []).map((d) => d.id));
                    const eligibleDrills = centerDrills.filter((d: Drill) => !categoryDrillIds.has(d.id));
                    return (
                      <div key={category.id} className="card-base">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-[var(--text-primary)]">{category.name}</h4>
                          {editable && (
                            <button
                              onClick={() => handleRemoveCategory(category.id)}
                              className="table-action-link table-action-link--danger text-xs"
                            >
                              Remove Category
                            </button>
                          )}
                        </div>

                        {editable && (
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
                                <span className="flex items-center gap-2">
                                  {videoUrls[drill.id] && (
                                    <button
                                      type="button"
                                      onClick={() => setViewingVideo({ name: drill.name, url: videoUrls[drill.id] })}
                                      aria-label={`Watch demonstration: ${drill.name}`}
                                      title="Watch demonstration"
                                      style={VIDEO_ICON_STYLE}
                                    >
                                      ▶
                                    </button>
                                  )}
                                  {editable && (
                                    <button
                                      onClick={() => handleRemoveDrill(category.id, drill.id)}
                                      className="table-action-link table-action-link--danger text-xs"
                                    >
                                      Remove
                                    </button>
                                  )}
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
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseBuilder} className="btn btn-secondary">Close</button>
              {(openSet.status === 'draft' || openSet.status === 'rejected') && (
                <button
                  onClick={() => handleSubmitSet(openSet)}
                  disabled={submitTargetId === openSet.id || totalOpenDrills === 0}
                  className="btn btn-primary"
                  title={totalOpenDrills === 0 ? 'Add at least one drill first' : undefined}
                >
                  {submitTargetId === openSet.id ? 'Submitting...' : 'Submit for Review'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Community Preview Panel — a drill set's full category/drill list can run
          long, so this opens as a right-side slide-over instead of a centered
          dialog that would run out of height. */}
      {previewSet && (
        <div className="side-panel-overlay" onClick={() => setPreviewSet(null)}>
          <div className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{previewSet.name}</h2>
              <button className="modal-close-btn" onClick={() => setPreviewSet(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                {previewSet.description || 'No description provided.'}
              </p>

              {drillPackCatalog.filter((item) => item.drillSetId === previewSet.id).length > 0 && (
                <div className="space-y-2 mb-4">
                  {drillPackCatalog
                    .filter((item) => item.drillSetId === previewSet.id)
                    .map((item) => {
                      const ownedSub = myDrillPacks.find((s) => s.marketplaceItemId === item.id);
                      const requested = myDrillPackRequests.some((r) => r.marketplaceItemId === item.id);
                      const trial = ownedSub ? getTrialInfo(ownedSub) : null;
                      // A paid sibling tier of a set the center is only trialing for
                      // free reads as an upgrade, not a fresh purchase.
                      const isUpgradeFromTrial =
                        item.price > 0 &&
                        drillPackCatalog
                          .filter((sibling) => sibling.drillSetId === item.drillSetId && sibling.id !== item.id)
                          .some((sibling) => {
                            const siblingSub = myDrillPacks.find((s) => s.marketplaceItemId === sibling.id);
                            return siblingSub && getTrialInfo(siblingSub) !== null;
                          });
                      return (
                        <div
                          key={item.id}
                          className="card-base flex items-center justify-between"
                          style={{ padding: 'var(--space-sm) var(--space-md)' }}
                        >
                          <div>
                            <span className="text-bold">
                              {item.tier === 'VIDEO_ENHANCED' ? 'With Video Tutorials' : 'Standard'}
                            </span>
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {formatDrillPackPrice(item.price)}
                              {item.price > 0 ? ' · one-time' : ''}
                            </div>
                            {trial && (
                              <div
                                className={`text-xs ${trial.expired ? 'font-semibold' : ''}`}
                                style={{ color: trial.expired ? 'var(--color-danger)' : 'var(--color-warning)' }}
                              >
                                {formatTrialLabel(trial)}
                              </div>
                            )}
                          </div>
                          {ownedSub ? (
                            <span className="badge-base badge-primary">Owned</span>
                          ) : requested ? (
                            <span className="badge-base badge-secondary">Requested</span>
                          ) : (
                            <button
                              className="btn btn-primary text-sm"
                              style={{ width: 'auto' }}
                              onClick={() => handleBuyDrillPack(item)}
                              disabled={buyingItemId === item.id}
                            >
                              {buyingItemId === item.id
                                ? 'Working...'
                                : item.price === 0
                                  ? 'Get Free'
                                  : isUpgradeFromTrial
                                    ? 'Upgrade to Paid'
                                    : 'Subscribe'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

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
                            <li key={drill.id} className="flex items-center justify-between">
                              <span>{drill.name}</span>
                              {videoUrls[drill.id] && (
                                <button
                                  type="button"
                                  onClick={() => setViewingVideo({ name: drill.name, url: videoUrls[drill.id] })}
                                  aria-label={`Watch demonstration: ${drill.name}`}
                                  title="Watch demonstration"
                                  style={VIDEO_ICON_STYLE}
                                >
                                  ▶
                                </button>
                              )}
                            </li>
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
              {/* Once the admin has priced this set, it's acquired only through
                  the tier Subscribe buttons above — no free bulk-copy bypass. */}
              {drillPackCatalog.filter((item) => item.drillSetId === previewSet.id).length === 0 && (
                <button
                  onClick={() => handleAdoptCommunity(previewSet)}
                  disabled={adoptingId === previewSet.id}
                  className="btn btn-primary"
                >
                  {adoptingId === previewSet.id ? 'Subscribing...' : `Subscribe (${previewSet.drillCount ?? 0} Drills)`}
                </button>
              )}
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
                  <a href={viewingVideo.url} target="_blank" rel="noreferrer">
                    Open demonstration video
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceGallery;

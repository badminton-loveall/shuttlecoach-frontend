import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Drill, DrillSet, DrillSetCategory, MarketplaceItem, CenterSubscription } from '../types';
import { useDrillSets } from '../hooks/useDrillSets';
import { useSetMarketplace } from '../hooks/useSetMarketplace';
import { useDrills } from '../hooks/useDrills';
import { SearchInput } from './SearchInput';
import { DrillAutocomplete } from './DrillAutocomplete';
import { PackEnabledToggle } from './PackEnabledToggle';
import { SPORT_LABELS, SUPPORTED_SPORTS } from '../constants/sports';
import { DEFAULT_DRILL_CATALOG_CATEGORIES, getDrillCategoryOptions } from '../constants/drillCatalogCategories';
import { useAuth } from '../contexts/AuthContext';
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
  aspectRatio: '1',
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
  alignSelf: 'center',
};

/**
 * Fallback for a demonstration clip that isn't a YouTube/Vimeo page link —
 * a direct file (S3, Cloudinary, a plain .mp4, etc.) plays right in the
 * modal via a native <video> element instead of just linking out. Only
 * falls back to a plain "open in new tab" link if the browser genuinely
 * can't play it (onError) — keyed by url from the caller so switching to a
 * different clip resets this instead of carrying over the previous one's
 * error state.
 */
const DirectVideoPlayer: React.FC<{ name: string; url: string }> = ({ name, url }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        Couldn&rsquo;t play this link in-page.{' '}
        <a href={url} target="_blank" rel="noreferrer">Open demonstration video</a>
      </p>
    );
  }
  return (
    <video
      controls
      autoPlay
      src={url}
      aria-label={name}
      onError={() => setFailed(true)}
      style={{ width: '100%', maxHeight: '70vh', display: 'block', borderRadius: 'var(--radius-md)', background: '#000' }}
    >
      <p className="text-sm text-[var(--text-secondary)]">
        Your browser can&rsquo;t play this video. <a href={url} target="_blank" rel="noreferrer">Open it in a new tab</a> instead.
      </p>
    </video>
  );
};

interface SetFormData {
  name: string;
  description: string;
  sport: string;
}

// Category/drill membership edits made inside the builder are staged here
// instead of hitting the API as each button is clicked — they're only sent
// to the server (in this order: categories added, categories removed, drills
// removed, drills added, drills renamed) when "Save Changes" or "Submit for
// Review" is pressed. `queuePendingOp` coalesces add/remove pairs for the
// same item down to nothing, and keeps only the latest rename per drill, so
// e.g. adding then removing a drill before saving never touches the server.
type PendingOp =
  | { type: 'addCategory'; tempId: string; name: string }
  | { type: 'removeCategory'; categoryId: string }
  | { type: 'addDrill'; categoryId: string; drillId: string }
  | { type: 'removeDrill'; categoryId: string; drillId: string }
  | { type: 'renameDrill'; drillId: string; name: string };

const emptyFormData: SetFormData = { name: '', description: '', sport: '' };

// Small inline trash-can icon — stands in for the repeated "Remove"/"Remove
// Category" text links in the set builder, so removal reads as one
// consistent icon action instead of a run of red text everywhere.
const TrashIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

// Small inline pencil icon — sits next to a click-to-rename title, category
// name, or drill name so it reads as editable at a glance instead of only
// on hover/click discovery.
const PencilIcon: React.FC<{ size?: number; className?: string }> = ({ size = 12, className = 'editable-hint' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

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
    unpublishSet,
    toggleEnabled,
  } = useDrillSets();

  // --- Community sets (also where the official pack appears until adopted) ---
  const {
    sets: communitySets,
    loading: communityLoading,
    adoptSet,
  } = useSetMarketplace();

  const { drills: centerDrills, refetch: refetchCenterDrills } = useDrills();
  const { role } = useAuth();
  const canCreateDrills = role === 'HEAD_COACH';

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

  // Unpublish confirmation
  const [unpublishingSet, setUnpublishingSet] = useState<DrillSet | null>(null);
  const [unpublishLoading, setUnpublishLoading] = useState(false);

  // Builder / viewer modal for a "mine" set
  const [openSet, setOpenSet] = useState<DrillSet | null>(null);
  const [openCategories, setOpenCategories] = useState<DrillSetCategory[]>([]);
  const [openLoading, setOpenLoading] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  // Which category's "add a drill" row is expanded — collapsed by default,
  // toggled by the + next to the category name.
  const [addingDrillForCategory, setAddingDrillForCategory] = useState<string | null>(null);
  const [submitTargetId, setSubmitTargetId] = useState<string | null>(null);
  const [editingDrill, setEditingDrill] = useState<{ drillId: string; name: string } | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  // Description/Sport stay collapsed until the title is clicked into edit —
  // keeps the panel compact for the common case (just managing categories)
  // and only surfaces the rest of the metadata form when actually wanted.
  // Set once on the first title click and left open for the rest of the
  // session so it doesn't vanish mid-edit when the title input blurs.
  const [metaExpanded, setMetaExpanded] = useState(false);
  // Staged category/drill edits, applied on Save Changes / Submit for
  // Review — see the PendingOp comment above.
  const [pendingOps, setPendingOps] = useState<PendingOp[]>([]);

  // Inline "create a new drill" form, opened per-category from within the builder
  const [creatingDrillForCategory, setCreatingDrillForCategory] = useState<string | null>(null);
  const [newDrillForm, setNewDrillForm] = useState({ name: '', description: '', category: DEFAULT_DRILL_CATALOG_CATEGORIES[0], videoUrl: '' });
  const [creatingDrillError, setCreatingDrillError] = useState<string | null>(null);
  const [creatingDrillLoading, setCreatingDrillLoading] = useState(false);
  const categoryOptions = getDrillCategoryOptions(centerDrills, [newDrillForm.category]);

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

  // --- Unpublish ---
  const handleConfirmUnpublish = async () => {
    if (!unpublishingSet) return;
    setUnpublishLoading(true);
    try {
      await unpublishSet(unpublishingSet.id);
      setSuccessMessage(`"${unpublishingSet.name}" is off the marketplace — it's back in Draft, so you can edit and resubmit it anytime.`);
      setUnpublishingSet(null);
    } catch (err) {
      setErrorMessage(extractError(err, 'Failed to unpublish set.'));
      setUnpublishingSet(null);
    } finally {
      setUnpublishLoading(false);
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

  // Coalesces a new op into the pending queue: an add cancelled out by a
  // later remove of the same item (or vice versa) is dropped entirely
  // rather than queued as two round-trips, and a second rename of the same
  // drill replaces the first rather than stacking.
  const queuePendingOp = (op: PendingOp) => {
    setPendingOps((prev) => {
      if (op.type === 'removeCategory') {
        const addIdx = prev.findIndex((o) => o.type === 'addCategory' && o.tempId === op.categoryId);
        if (addIdx !== -1) {
          // Category never existed server-side — drop it and anything queued under it.
          return prev.filter((o, i) => i !== addIdx && !('categoryId' in o && o.categoryId === op.categoryId));
        }
        // Real category — anything else queued for it is moot once it's deleted.
        return [...prev.filter((o) => !('categoryId' in o && o.categoryId === op.categoryId)), op];
      }
      if (op.type === 'removeDrill') {
        const addIdx = prev.findIndex((o) => o.type === 'addDrill' && o.categoryId === op.categoryId && o.drillId === op.drillId);
        if (addIdx !== -1) return prev.filter((_, i) => i !== addIdx);
        return [...prev, op];
      }
      if (op.type === 'renameDrill') {
        return [...prev.filter((o) => !(o.type === 'renameDrill' && o.drillId === op.drillId)), op];
      }
      return [...prev, op];
    });
  };

  // Sends every staged op to the server in dependency order (categories
  // before the drills that live in them), then reloads from the server so
  // temp ids and any partial failures resolve to the real, current state.
  // Returns false if anything failed, so callers (Submit for Review) can
  // hold off rather than submit a set that didn't fully save.
  const flushPendingChanges = async (): Promise<boolean> => {
    if (!openSet || pendingOps.length === 0) return true;
    let hadError = false;
    const tempIdMap: Record<string, string> = {};

    for (const op of pendingOps) {
      if (op.type !== 'addCategory') continue;
      try {
        const created = await createSetCategory(openSet.id, op.name);
        tempIdMap[op.tempId] = created.id;
      } catch {
        hadError = true;
      }
    }

    const resolveCategoryId = (id: string) => tempIdMap[id] || id;

    for (const op of pendingOps) {
      if (op.type !== 'removeCategory') continue;
      try {
        await deleteSetCategory(openSet.id, resolveCategoryId(op.categoryId));
      } catch {
        hadError = true;
      }
    }

    for (const op of pendingOps) {
      if (op.type !== 'removeDrill') continue;
      try {
        await removeDrillFromSetCategory(openSet.id, resolveCategoryId(op.categoryId), op.drillId);
      } catch {
        hadError = true;
      }
    }

    for (const op of pendingOps) {
      if (op.type !== 'addDrill') continue;
      try {
        await addDrillToSetCategory(openSet.id, resolveCategoryId(op.categoryId), op.drillId);
      } catch {
        hadError = true;
      }
    }

    for (const op of pendingOps) {
      if (op.type !== 'renameDrill') continue;
      try {
        await apiClient.patch(`/drills/${op.drillId}`, { name: op.name });
      } catch {
        hadError = true;
      }
    }

    setPendingOps([]);
    await loadOpenDetail(openSet);
    return !hadError;
  };

  const handleOpenBuilder = async (set: DrillSet) => {
    let target = set;
    if (set.status === 'pending_review') {
      try {
        target = await unpublishSet(set.id);
        setSuccessMessage('Pulled back to draft so you can edit it — resubmit when you\'re ready.');
      } catch (err) {
        setErrorMessage(extractError(err, 'Failed to withdraw this set for editing.'));
      }
    }
    setOpenSet(target);
    setFormData({ name: target.name, description: target.description || '', sport: target.sport || '' });
    setFormError(null);
    setNewCategoryName('');
    setAddingDrillForCategory(null);
    setVideoUrls({});
    setEditingDrill(null);
    setEditingTitle(false);
    setMetaExpanded(false);
    setPendingOps([]);
    await Promise.all([loadOpenDetail(target), loadVideoUrls(target.id)]);
  };

  const handleCloseBuilder = async () => {
    setOpenSet(null);
    setOpenCategories([]);
    setOpenError(null);
    setVideoUrls({});
    setEditingDrill(null);
    setEditingTitle(false);
    setMetaExpanded(false);
    setPendingOps([]);
    await refetchMine();
  };

  const handleSaveChanges = async () => {
    if (!openSet) return;
    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }
    setSavingForm(true);
    setFormError(null);
    try {
      const updated = await updateSet(openSet.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sport: formData.sport || undefined,
      });
      setOpenSet(updated);
      const ok = await flushPendingChanges();
      setSuccessMessage(ok ? 'Set updated' : 'Set updated, but some category/drill changes failed to save — please check and retry.');
    } catch {
      setFormError('An error occurred. Please try again.');
    } finally {
      setSavingForm(false);
    }
  };

  // --- Inline drill-name editing (within the builder, draft/rejected only) ---
  const handleStartEditDrillName = (drill: Drill) => {
    setEditingDrill({ drillId: drill.id, name: drill.name });
  };

  const handleCancelEditDrillName = () => {
    setEditingDrill(null);
  };

  const handleSaveDrillName = () => {
    if (!editingDrill) return;
    const trimmed = editingDrill.name.trim();
    if (!trimmed) {
      setEditingDrill(null);
      return;
    }
    const { drillId } = editingDrill;
    setOpenCategories((prev) => prev.map((c) => ({
      ...c,
      drills: (c.drills || []).map((d) => (d.id === drillId ? { ...d, name: trimmed } : d)),
    })));
    queuePendingOp({ type: 'renameDrill', drillId, name: trimmed });
    setEditingDrill(null);
  };

  // Category/drill membership edits below only touch local state
  // (openCategories) plus the pending-ops queue — nothing reaches the API
  // until Save Changes or Submit for Review calls flushPendingChanges.
  const handleAddCategory = () => {
    if (!openSet || !newCategoryName.trim()) return;
    const name = newCategoryName.trim();
    const tempId = `temp-cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setOpenCategories((prev) => [
      ...prev,
      { id: tempId, setId: openSet.id, name, sortOrder: prev.length, createdAt: '', updatedAt: '', drills: [] },
    ]);
    queuePendingOp({ type: 'addCategory', tempId, name });
    setNewCategoryName('');
  };

  const handleRemoveCategory = (categoryId: string) => {
    setOpenCategories((prev) => prev.filter((c) => c.id !== categoryId));
    queuePendingOp({ type: 'removeCategory', categoryId });
  };

  const handleAddDrill = (categoryId: string, drillId: string) => {
    const drill = centerDrills.find((d) => d.id === drillId);
    if (!drill) return;
    setOpenCategories((prev) => prev.map((c) => (
      c.id === categoryId ? { ...c, drills: [...(c.drills || []), drill] } : c
    )));
    queuePendingOp({ type: 'addDrill', categoryId, drillId });
  };

  // --- Inline "create a new drill" (right from the set builder, no separate trip
  // to the drill library) — Reached from the drill combobox when nothing in the
  // catalog already matches what was typed. The drill record itself is created
  // right away (it's reusable center-wide catalog data, not set-specific); only
  // linking it into this category is staged like every other membership edit. ---
  const handleOpenCreateDrill = (categoryId: string, categoryName: string, prefillName = '') => {
    setCreatingDrillForCategory(categoryId);
    setNewDrillForm({ name: prefillName, description: '', category: categoryName || DEFAULT_DRILL_CATALOG_CATEGORIES[0], videoUrl: '' });
    setCreatingDrillError(null);
  };

  const handleCancelCreateDrill = () => {
    setCreatingDrillForCategory(null);
    setCreatingDrillError(null);
  };

  const handleCreateAndAddDrill = async (categoryId: string) => {
    if (!openSet) return;
    if (!newDrillForm.name.trim() || !newDrillForm.description.trim()) {
      setCreatingDrillError('Name and description are required.');
      return;
    }
    setCreatingDrillLoading(true);
    setCreatingDrillError(null);
    try {
      const response = await apiClient.post('/drills', {
        name: newDrillForm.name.trim(),
        description: newDrillForm.description.trim(),
        category: newDrillForm.category,
        sport: openSet.sport || 'badminton',
        videoUrl: newDrillForm.videoUrl.trim() || undefined,
      });
      const newDrill = response.data;
      await refetchCenterDrills();
      setOpenCategories((prev) => prev.map((c) => (
        c.id === categoryId ? { ...c, drills: [...(c.drills || []), newDrill] } : c
      )));
      queuePendingOp({ type: 'addDrill', categoryId, drillId: newDrill.id });
      setCreatingDrillForCategory(null);
    } catch (err) {
      setCreatingDrillError(extractError(err, 'Failed to create drill.'));
    } finally {
      setCreatingDrillLoading(false);
    }
  };

  const handleRemoveDrill = (categoryId: string, drillId: string) => {
    setOpenCategories((prev) => prev.map((c) => (
      c.id === categoryId ? { ...c, drills: (c.drills || []).filter((d) => d.id !== drillId) } : c
    )));
    queuePendingOp({ type: 'removeDrill', categoryId, drillId });
  };

  const handleSubmitSet = async (set: DrillSet) => {
    setSubmitTargetId(set.id);
    try {
      if (openSet?.id === set.id && pendingOps.length > 0) {
        const ok = await flushPendingChanges();
        if (!ok) {
          setErrorMessage('Some changes failed to save — please review the set before submitting again.');
          setSubmitTargetId(null);
          return;
        }
      }
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
  const hasEmptyCategory = openCategories.some((c) => (c.drills?.length || 0) === 0);
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
              <div className="card-header">
                <div className="marketplace-card-title-row">
                  <h3 className="card-title" style={{ marginBottom: 0 }}>{item.title}</h3>
                  {item.owner === 'mine' && (
                    <PackEnabledToggle
                      checked={item.set.isEnabled}
                      onChange={(next) => handleToggleMineSet(item.set.id, next)}
                    />
                  )}
                </div>
                <div className="marketplace-card-badges flex flex-wrap gap-1" style={{ marginTop: 'var(--space-sm)' }}>
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
                {item.owner === 'community' && !item.isOfficial && (
                  <p className="card-description" style={{ marginTop: 'var(--space-xs, 4px)', marginBottom: 0 }}>
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
                  <div className="marketplace-card-actions">
                    {(item.status === 'draft' || item.status === 'rejected' || item.status === 'pending_review') && (
                      <button
                        onClick={() => setDeletingSet(item.set)}
                        className="btn btn-danger text-sm"
                      >
                        Delete
                      </button>
                    )}
                    {item.status === 'published' && (
                      <button
                        onClick={() => setUnpublishingSet(item.set)}
                        className="btn btn-danger text-sm"
                      >
                        Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenBuilder(item.set)}
                      className="btn btn-secondary text-sm"
                    >
                      {item.status === 'draft' || item.status === 'rejected' || item.status === 'pending_review' ? 'Edit' : 'View'}
                    </button>
                  </div>
                )}

                {item.owner === 'community' && (
                  <div className="marketplace-card-actions">
                    <button
                      onClick={() => handleOpenPreview(item.set)}
                      className="btn btn-secondary text-sm"
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
                        className="btn btn-primary text-sm"
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

      {/* Unpublish Confirmation */}
      {unpublishingSet && (
        <div className="modal-overlay">
          <div className="modal-content modal-content--small">
            <div className="modal-header">
              <h2 className="modal-title text-red-600 dark:text-red-400">Unpublish Set?</h2>
              <button className="modal-close-btn" onClick={() => setUnpublishingSet(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-[var(--text-secondary)]">
                &ldquo;{unpublishingSet.name}&rdquo; will come off the marketplace and go back to Draft. Centers
                that already adopted it keep their own copy — this only affects new adoptions going forward.
                You can edit it and resubmit for review anytime.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setUnpublishingSet(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleConfirmUnpublish} disabled={unpublishLoading} className="btn btn-danger">
                {unpublishLoading ? 'Unpublishing...' : 'Unpublish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Builder / Viewer Panel */}
      {openSet && (() => {
        const editableSet = openSet.status === 'draft' || openSet.status === 'rejected';
        return (
        <div className="side-panel-overlay">
          <div className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {editableSet && editingTitle ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); setEditingTitle(false); }
                    if (e.key === 'Escape') { e.preventDefault(); setFormData({ ...formData, name: openSet.name }); setEditingTitle(false); }
                  }}
                  autoFocus
                  className="form-input modal-title-input"
                  placeholder="Set name"
                  aria-label="Set name"
                />
              ) : (
                <h2
                  className={`modal-title${editableSet ? ' modal-title--editable' : ''}`}
                  onClick={() => {
                    if (!editableSet) return;
                    setEditingTitle(true);
                    setMetaExpanded(true);
                  }}
                  title={editableSet ? 'Click to rename' : undefined}
                >
                  {(editableSet ? formData.name : openSet.name) || openSet.name}
                  {editableSet && <PencilIcon size={14} />}
                </h2>
              )}
              <button className="modal-close-btn" onClick={handleCloseBuilder}>✕</button>
            </div>
            <div className="modal-body builder-stack-lg">
              {openError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm">
                  {openError}
                </div>
              )}

              {editableSet && metaExpanded && (
                <div className="card-base card-compact builder-stack-md" style={{ background: 'var(--surface-muted)' }}>
                  {formError && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{formError}</p>}
                  <div className="builder-field">
                    <label htmlFor="builder-set-description" className="builder-field-label">Description</label>
                    <textarea
                      id="builder-set-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="form-input text-sm"
                      placeholder="What is this set for?"
                      rows={2}
                    />
                  </div>
                  <div className="builder-field">
                    <label htmlFor="builder-set-sport" className="builder-field-label">Sport</label>
                    <select
                      id="builder-set-sport"
                      value={formData.sport}
                      onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                      className="form-input text-sm"
                    >
                      <option value="">Not specified</option>
                      {SUPPORTED_SPORTS.map((sport) => (
                        <option key={sport} value={sport}>{SPORT_LABELS[sport]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {editableSet && (
                <div className="flex gap-2">
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
                <div className="builder-stack-lg">
                  {openCategories.map((category) => {
                    const editable = editableSet;
                    const categoryDrillIds = new Set((category.drills || []).map((d) => d.id));
                    const eligibleDrills = centerDrills.filter((d: Drill) => !categoryDrillIds.has(d.id));
                    return (
                      <div key={category.id} className="card-base builder-stack-md">
                        <div className="flex items-start justify-between builder-category-header">
                          <h4 className="font-semibold text-[var(--text-primary)]">{category.name}</h4>
                          {editable && (
                            <button
                              onClick={() => handleRemoveCategory(category.id)}
                              className="icon-btn icon-btn--danger"
                              aria-label="Remove category"
                              title="Remove category"
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>

                        {category.drills && category.drills.length > 0 ? (
                          <ul className="builder-drill-list">
                            {category.drills.map((drill) => (
                              <li key={drill.id} className="builder-drill-row text-sm">
                                {editable && editingDrill?.drillId === drill.id ? (
                                  <input
                                    type="text"
                                    value={editingDrill.name}
                                    onChange={(e) => setEditingDrill({ drillId: drill.id, name: e.target.value })}
                                    onBlur={handleSaveDrillName}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') { e.preventDefault(); handleSaveDrillName(); }
                                      if (e.key === 'Escape') { e.preventDefault(); handleCancelEditDrillName(); }
                                    }}
                                    autoFocus
                                    className="form-input text-sm"
                                    style={{ flex: 1, marginRight: 'var(--space-sm)' }}
                                  />
                                ) : (
                                  <span
                                    className={editable ? 'editable-text' : undefined}
                                    onClick={() => editable && handleStartEditDrillName(drill)}
                                    title={editable ? 'Click to rename' : undefined}
                                  >
                                    {drill.name}
                                    {editable && <PencilIcon size={11} />}
                                  </span>
                                )}
                                <span className="flex items-center gap-2">
                                  {videoUrls[drill.id] && (
                                    <button
                                      type="button"
                                      onClick={() => setViewingVideo({ name: drill.name, url: videoUrls[drill.id] })}
                                      aria-label={`Watch demonstration: ${drill.name}`}
                                      title="Watch demonstration"
                                      className="video-icon-btn"
                                      style={VIDEO_ICON_STYLE}
                                    >
                                      ▶
                                    </button>
                                  )}
                                  {editable && (
                                    <button
                                      onClick={() => handleRemoveDrill(category.id, drill.id)}
                                      className="icon-btn icon-btn--danger"
                                      aria-label={`Remove ${drill.name}`}
                                      title="Remove drill"
                                    >
                                      <TrashIcon size={13} />
                                    </button>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
                            No drills yet — add at least one before submitting.
                          </p>
                        )}

                        {!editable ? null : addingDrillForCategory !== category.id ? (
                          <button
                            onClick={() => setAddingDrillForCategory(category.id)}
                            className="builder-add-drill-btn"
                          >
                            <span aria-hidden="true">+</span> Add a drill
                          </button>
                        ) : creatingDrillForCategory !== category.id ? (
                          <DrillAutocomplete
                            allDrills={centerDrills}
                            eligibleDrills={eligibleDrills}
                            onSelectExisting={(drill) => handleAddDrill(category.id, drill.id)}
                            onCreateNew={canCreateDrills ? (name) => handleOpenCreateDrill(category.id, category.name, name) : undefined}
                            placeholder="Type a drill name..."
                          />
                        ) : (
                          <div className="card-base p-3" style={{ background: 'var(--surface-muted)' }}>
                            {creatingDrillError && (
                              <p className="text-xs mb-2" style={{ color: 'var(--color-danger)' }}>{creatingDrillError}</p>
                            )}
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={newDrillForm.name}
                                onChange={(e) => setNewDrillForm((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Drill name"
                                className="form-input text-sm"
                                autoFocus
                              />
                              <textarea
                                value={newDrillForm.description}
                                onChange={(e) => setNewDrillForm((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Description"
                                className="form-input text-sm"
                                rows={2}
                              />
                              <select
                                value={newDrillForm.category}
                                onChange={(e) => setNewDrillForm((prev) => ({ ...prev, category: e.target.value }))}
                                className="form-input text-sm"
                                aria-label="Drill category"
                              >
                                {categoryOptions.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={newDrillForm.videoUrl}
                                onChange={(e) => setNewDrillForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                                placeholder="Video URL (optional)"
                                className="form-input text-sm"
                              />
                              <div className="flex gap-2 justify-end">
                                <button onClick={handleCancelCreateDrill} className="btn btn-secondary text-sm" disabled={creatingDrillLoading}>
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleCreateAndAddDrill(category.id)}
                                  className="btn btn-primary text-sm"
                                  disabled={creatingDrillLoading || !newDrillForm.name.trim() || !newDrillForm.description.trim()}
                                >
                                  {creatingDrillLoading ? 'Creating...' : 'Create & Add'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={handleCloseBuilder} className="btn btn-secondary">Close</button>
              {editableSet && (
                <button onClick={handleSaveChanges} disabled={savingForm} className="btn btn-secondary">
                  {savingForm ? 'Saving...' : pendingOps.length > 0 ? `Save Changes (${pendingOps.length})` : 'Save Changes'}
                </button>
              )}
              {editableSet && (
                <button
                  onClick={() => handleSubmitSet(openSet)}
                  disabled={submitTargetId === openSet.id || totalOpenDrills === 0 || hasEmptyCategory}
                  className="btn btn-primary"
                  title={
                    totalOpenDrills === 0
                      ? 'Add at least one drill first'
                      : hasEmptyCategory
                        ? 'Every category needs at least one drill before you can submit'
                        : undefined
                  }
                >
                  {submitTargetId === openSet.id ? 'Submitting...' : 'Submit for Review'}
                </button>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Community Preview Panel — a drill set's full category/drill list can run
          long, so this opens as a right-side slide-over instead of a centered
          dialog that would run out of height. */}
      {previewSet && (
        <div className="side-panel-overlay">
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
                                  className="video-icon-btn"
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
                <DirectVideoPlayer key={viewingVideo.url} name={viewingVideo.name} url={viewingVideo.url} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceGallery;

import React, { useState, useEffect, useCallback } from 'react';
import type { MarketplaceItem, MarketplaceItemCategory } from '../types';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * AdminSubscriptionCatalog Component
 *
 * Manages recurring application plans a center can subscribe to — Accounting
 * access and coach/student capacity add-ons. Drill packs are priced and
 * managed on the Marketplace page (/admin/marketplace) instead, alongside
 * the content review workflow they belong to — this page never shows them.
 * Every price here is editable — 0 shows as "Free."
 */

const NON_DRILL_PACK_CATEGORIES: MarketplaceItemCategory[] = ['ACCOUNTING', 'STUDENT_CAPACITY', 'COACH_CAPACITY'];

const CATEGORY_LABEL: Record<Exclude<MarketplaceItemCategory, 'DRILL_PACK'>, string> = {
  ACCOUNTING: 'Accounting',
  STUDENT_CAPACITY: 'Student Capacity',
  COACH_CAPACITY: 'Coach Capacity',
};

interface CreateForm {
  name: string;
  description: string;
  category: Exclude<MarketplaceItemCategory, 'DRILL_PACK'>;
  capacityLimit: string;
  price: string;
  durationDays: string;
}

const EMPTY_CREATE_FORM: CreateForm = {
  name: '',
  description: '',
  category: 'ACCOUNTING',
  capacityLimit: '',
  price: '0',
  durationDays: '',
};

interface EditForm {
  name: string;
  description: string;
  price: string;
  durationDays: string;
  isEnabled: boolean;
}

const formatPrice = (price: number): string =>
  price === 0
    ? 'Free'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export const AdminSubscriptionCatalog: React.FC = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSavingCreate, setIsSavingCreate] = useState(false);

  const [editing, setEditing] = useState<MarketplaceItem | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<MarketplaceItem[]>('/admin/marketplace-items', {
        params: { category: NON_DRILL_PACK_CATEGORIES.join(',') },
      });
      setItems(response.data);
    } catch {
      setError('Failed to load the subscription catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleOpenCreate = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError(null);
    setIsCreating(true);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      setCreateError('Name is required.');
      return;
    }
    const price = Number(createForm.price);
    if (Number.isNaN(price) || price < 0) {
      setCreateError('Price must be zero or a positive number.');
      return;
    }
    if (
      (createForm.category === 'STUDENT_CAPACITY' || createForm.category === 'COACH_CAPACITY') &&
      !createForm.capacityLimit
    ) {
      setCreateError('Enter the capacity limit for this tier.');
      return;
    }

    setIsSavingCreate(true);
    setCreateError(null);
    try {
      await apiClient.post('/admin/marketplace-items', {
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        category: createForm.category,
        capacityLimit:
          createForm.category === 'STUDENT_CAPACITY' || createForm.category === 'COACH_CAPACITY'
            ? Number(createForm.capacityLimit)
            : undefined,
        price,
        durationDays: createForm.durationDays ? Number(createForm.durationDays) : undefined,
      });
      setSuccessMessage(`"${createForm.name.trim()}" added to the catalog.`);
      setIsCreating(false);
      await fetchItems();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setCreateError(message || 'Failed to create the item.');
    } finally {
      setIsSavingCreate(false);
    }
  };

  const handleOpenEdit = (item: MarketplaceItem) => {
    setEditing(item);
    setEditForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      durationDays: item.durationDays ? String(item.durationDays) : '',
      isEnabled: item.isEnabled,
    });
    setEditError(null);
  };

  const handleCloseEdit = () => {
    setEditing(null);
    setEditForm(null);
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
        isEnabled: editForm.isEnabled,
      });
      setSuccessMessage(`"${editForm.name.trim()}" updated.`);
      handleCloseEdit();
      await fetchItems();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      setEditError(message || 'Failed to update the item.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleEnabled = async (item: MarketplaceItem) => {
    try {
      await apiClient.patch(`/admin/marketplace-items/${item.id}`, { isEnabled: !item.isEnabled });
      await fetchItems();
    } catch {
      setError(`Failed to ${item.isEnabled ? 'disable' : 'enable'} "${item.name}".`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="admin-page-header">
        <div className="flex items-center justify-between">
          <p className="admin-page-subtitle" style={{ marginBottom: 0 }}>
            Recurring plans a center can subscribe to — Accounting access and coach/student capacity add-ons. Drill
            packs are priced on the Marketplace page instead. Every price is editable; 0 shows as Free.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            Add Item
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchItems} className="btn btn-secondary text-xs ml-2">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card p-6 text-center text-[var(--text-secondary)]">Loading catalog...</div>
      ) : items.length === 0 ? (
        <div className="table-filter-section">
          <div className="table-empty">No items in the catalog yet — add one above.</div>
        </div>
      ) : (
        <div className="table-filter-section">
        <div className="table-container">
          <table className="table-styled">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="text-bold">{item.name}</span>
                    {item.description && (
                      <div className="text-xs" style={{ marginTop: 2, color: 'var(--text-secondary)' }}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge-base badge-secondary">
                      {CATEGORY_LABEL[item.category as Exclude<MarketplaceItemCategory, 'DRILL_PACK'>]}
                    </span>
                    {item.capacityLimit != null && (
                      <span className="text-xs" style={{ marginLeft: 6, color: 'var(--text-secondary)' }}>
                        limit {item.capacityLimit}
                      </span>
                    )}
                  </td>
                  <td className={item.price === 0 ? 'text-bold' : undefined}>
                    {formatPrice(item.price)}
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {item.billingPeriod === 'ONE_TIME' ? 'one-time' : 'monthly'}
                    </div>
                  </td>
                  <td className="text-muted">{item.durationDays ? `${item.durationDays} days` : 'Lifetime'}</td>
                  <td>
                    <span className={`table-badge ${item.isEnabled ? 'table-badge--success' : 'table-badge--overdue'}`}>
                      {item.isEnabled ? 'Sellable' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="table-action-link" onClick={() => handleOpenEdit(item)}>
                        Edit
                      </button>
                      <button
                        className={`table-action-link ${item.isEnabled ? 'table-action-link--danger' : ''}`}
                        onClick={() => handleToggleEnabled(item)}
                      >
                        {item.isEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Create modal */}
      {isCreating && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add Catalog Item</h2>
              <button className="modal-close-btn" onClick={() => setIsCreating(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body space-y-3">
              {createError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm">
                  {createError}
                </div>
              )}
              <div className="form-group">
                <label className="form-label" htmlFor="create-category">
                  Category
                </label>
                <select
                  id="create-category"
                  className="form-input"
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      category: e.target.value as Exclude<MarketplaceItemCategory, 'DRILL_PACK'>,
                    }))
                  }
                >
                  {(Object.keys(CATEGORY_LABEL) as Exclude<MarketplaceItemCategory, 'DRILL_PACK'>[]).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="create-name">
                  Name
                </label>
                <input
                  id="create-name"
                  className="form-input"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  maxLength={150}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="create-description">
                  Description
                </label>
                <textarea
                  id="create-description"
                  className="form-input"
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              {(createForm.category === 'STUDENT_CAPACITY' || createForm.category === 'COACH_CAPACITY') && (
                <div className="form-group">
                  <label className="form-label" htmlFor="create-capacity">
                    Capacity Limit
                  </label>
                  <input
                    id="create-capacity"
                    className="form-input"
                    type="number"
                    min={1}
                    value={createForm.capacityLimit}
                    onChange={(e) => setCreateForm((f) => ({ ...f, capacityLimit: e.target.value }))}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="create-price">
                  Price (₹/month, 0 for Free)
                </label>
                <input
                  id="create-price"
                  className="form-input"
                  type="number"
                  min={0}
                  value={createForm.price}
                  onChange={(e) => setCreateForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="create-duration">
                  Auto-expires after (days, optional — for time-limited demos)
                </label>
                <input
                  id="create-duration"
                  className="form-input"
                  type="number"
                  min={1}
                  value={createForm.durationDays}
                  onChange={(e) => setCreateForm((f) => ({ ...f, durationDays: e.target.value }))}
                  placeholder="Leave blank for a lifetime subscription"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsCreating(false)} disabled={isSavingCreate}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={isSavingCreate}>
                {isSavingCreate ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && editForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit {editing.name}</h2>
              <button className="modal-close-btn" onClick={handleCloseEdit}>
                ✕
              </button>
            </div>
            <div className="modal-body space-y-3">
              {editError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm">
                  {editError}
                </div>
              )}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-name">
                  Name
                </label>
                <input
                  id="edit-name"
                  className="form-input"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, name: e.target.value } : f))}
                  maxLength={150}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-description">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  className="form-input"
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, description: e.target.value } : f))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-price">
                  Price (₹/month, 0 for Free)
                </label>
                <input
                  id="edit-price"
                  className="form-input"
                  type="number"
                  min={0}
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, price: e.target.value } : f))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-duration">
                  Auto-expires after (days, optional)
                </label>
                <input
                  id="edit-duration"
                  className="form-input"
                  type="number"
                  min={1}
                  value={editForm.durationDays}
                  onChange={(e) => setEditForm((f) => (f ? { ...f, durationDays: e.target.value } : f))}
                  placeholder="Leave blank for a lifetime subscription"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-enabled">
                  <input
                    id="edit-enabled"
                    type="checkbox"
                    checked={editForm.isEnabled}
                    onChange={(e) => setEditForm((f) => (f ? { ...f, isEnabled: e.target.checked } : f))}
                  />{' '}
                  Sellable (Catalog Switch — off pulls it from browsing, existing subscribers unaffected)
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseEdit} disabled={isSavingEdit}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={isSavingEdit}>
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionCatalog;

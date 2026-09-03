import React, { useState } from 'react';
import AdminSubscriptionCatalog from '../../components/AdminSubscriptionCatalog';
import AdminSubscriptionRequests from '../../components/AdminSubscriptionRequests';
import AdminSubscriptionRevenue from '../../components/AdminSubscriptionRevenue';
import '../../styles/pages.css';

/**
 * AdminSubscriptionCatalogPage
 * Admin page for the Center Marketplace: price and gate everything a center
 * can subscribe to (Catalog tab), approve or reject coach-initiated requests
 * for paid items (Requests tab), and see what's earning and who's holding
 * what (Revenue tab).
 */
const AdminSubscriptionCatalogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'requests' | 'revenue'>('catalog');

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Subscriptions</h1>
      </div>
      <nav className="sp-tab-nav" role="tablist" aria-label="Subscriptions tabs" style={{ marginBottom: 'var(--space-lg)' }}>
        <button
          role="tab"
          aria-selected={activeTab === 'catalog'}
          className={`sp-tab${activeTab === 'catalog' ? ' sp-tab--active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          Catalog
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'requests'}
          className={`sp-tab${activeTab === 'requests' ? ' sp-tab--active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'revenue'}
          className={`sp-tab${activeTab === 'revenue' ? ' sp-tab--active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          Revenue
        </button>
      </nav>

      {activeTab === 'catalog' && <AdminSubscriptionCatalog />}
      {activeTab === 'requests' && <AdminSubscriptionRequests />}
      {activeTab === 'revenue' && <AdminSubscriptionRevenue />}
    </div>
  );
};

export default AdminSubscriptionCatalogPage;

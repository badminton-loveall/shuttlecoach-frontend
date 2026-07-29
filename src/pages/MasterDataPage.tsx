import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import BatchesTab from '../components/BatchesTab';
import { DrillsTab } from '../components/DrillsTab';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages.css';

/**
 * MasterDataPage
 * Top-level page with tabbed navigation for managing batches and drills.
 * Accessible by HEAD_COACH (full CRUD) and ASSISTANT_COACH (read-only).
 *
 * Requirements: 5.1, 5.2, 5.5, 5.6
 */
export const MasterDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'batches' | 'drills'>('batches');
  const { role } = useAuth();
  const isReadOnly = role !== 'HEAD_COACH';

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Master Data</h1>
              <p className="page-header-subtitle">Manage batches, drills, and reference data</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="sp-tab-nav" role="tablist" aria-label="Master data tabs">
            <button
              role="tab"
              aria-selected={activeTab === 'batches'}
              className={`sp-tab${activeTab === 'batches' ? ' sp-tab--active' : ''}`}
              onClick={() => setActiveTab('batches')}
            >
              Batches
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'drills'}
              className={`sp-tab${activeTab === 'drills' ? ' sp-tab--active' : ''}`}
              onClick={() => setActiveTab('drills')}
            >
              Drills
            </button>
          </nav>

          {/* Tab Content */}
          {activeTab === 'batches' && (
            <BatchesTab readOnly={isReadOnly} />
          )}
          {activeTab === 'drills' && (
            <DrillsTab readOnly={isReadOnly} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MasterDataPage;

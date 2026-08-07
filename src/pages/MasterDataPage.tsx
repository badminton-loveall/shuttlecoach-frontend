import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import BatchesTab from '../components/BatchesTab';
import { DrillsTab } from '../components/DrillsTab';
import CenterSettingsTab from '../components/CenterSettingsTab';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages.css';

/**
 * MasterDataPage (Settings)
 * Top-level page with tabbed navigation for managing center settings, batches, and drills.
 * Accessible by HEAD_COACH (full CRUD) and ASSISTANT_COACH (read-only).
 *
 * Requirements: 5.1, 5.2, 5.5, 5.6, 7.1, 7.6
 */
export const MasterDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'batches' | 'drills' | 'center'>('batches');
  const { role } = useAuth();
  const isReadOnly = role !== 'HEAD_COACH';
  const canViewCenterTab = role === 'HEAD_COACH' || role === 'ADMIN';

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Settings</h1>
              <p className="page-header-subtitle">Manage center settings, batches, and drills</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="sp-tab-nav" role="tablist" aria-label="Settings tabs">
            {canViewCenterTab && (
              <button
                role="tab"
                aria-selected={activeTab === 'center'}
                className={`sp-tab${activeTab === 'center' ? ' sp-tab--active' : ''}`}
                onClick={() => setActiveTab('center')}
              >
                Center
              </button>
            )}
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
          {activeTab === 'center' && canViewCenterTab && (
            <CenterSettingsTab />
          )}
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

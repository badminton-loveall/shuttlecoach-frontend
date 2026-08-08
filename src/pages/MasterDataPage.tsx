import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CenterSettingsTab from '../components/CenterSettingsTab';
import TemplatesTab from '../components/TemplatesTab';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages.css';

/**
 * MasterDataPage (Settings)
 * Top-level page for center settings and templates management.
 * Accessible by HEAD_COACH (full CRUD).
 * Batches and Drills have been moved to standalone pages under Training menu.
 */
export const MasterDataPage: React.FC = () => {
  const { role } = useAuth();
  const isReadOnly = role !== 'HEAD_COACH';

  const [activeTab, setActiveTab] = useState<'center' | 'templates'>('center');

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Settings</h1>
              <p className="page-header-subtitle">Manage center settings and templates</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="sp-tab-nav" role="tablist" aria-label="Settings tabs">
            <button
              role="tab"
              aria-selected={activeTab === 'center'}
              className={`sp-tab${activeTab === 'center' ? ' sp-tab--active' : ''}`}
              onClick={() => setActiveTab('center')}
            >
              Center
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'templates'}
              className={`sp-tab${activeTab === 'templates' ? ' sp-tab--active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              Templates
            </button>
          </nav>

          {/* Tab Content */}
          {activeTab === 'center' && (
            <CenterSettingsTab />
          )}
          {activeTab === 'templates' && (
            <TemplatesTab readOnly={isReadOnly} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MasterDataPage;

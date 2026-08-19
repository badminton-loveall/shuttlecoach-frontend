import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CenterSettingsTab from '../components/CenterSettingsTab';
import TemplatesTab from '../components/TemplatesTab';
import { DrillsTab } from '../components/DrillsTab';
import { MarketplaceTab } from '../components/MarketplaceTab';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages.css';

export const MasterDataPage: React.FC = () => {
  const { role } = useAuth();
  const isReadOnly = role !== 'HEAD_COACH';
  const isHeadCoach = role === 'HEAD_COACH';

  const [activeTab, setActiveTab] = useState<'center' | 'templates' | 'drills' | 'marketplace'>('center');

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Settings</h1>
              <p className="page-header-subtitle">Manage center settings, templates and drills</p>
            </div>
          </div>

          <nav className="sp-tab-nav" role="tablist" aria-label="Settings tabs">
            <button role="tab" aria-selected={activeTab === 'center'} className={`sp-tab${activeTab === 'center' ? ' sp-tab--active' : ''}`} onClick={() => setActiveTab('center')}>
              Center
            </button>
            <button role="tab" aria-selected={activeTab === 'templates'} className={`sp-tab${activeTab === 'templates' ? ' sp-tab--active' : ''}`} onClick={() => setActiveTab('templates')}>
              Templates
            </button>
            <button role="tab" aria-selected={activeTab === 'drills'} className={`sp-tab${activeTab === 'drills' ? ' sp-tab--active' : ''}`} onClick={() => setActiveTab('drills')}>
              Drills
            </button>
            {isHeadCoach && (
              <button role="tab" aria-selected={activeTab === 'marketplace'} className={`sp-tab${activeTab === 'marketplace' ? ' sp-tab--active' : ''}`} onClick={() => setActiveTab('marketplace')}>
                Marketplace
              </button>
            )}
          </nav>

          {activeTab === 'center' && <CenterSettingsTab />}
          {activeTab === 'templates' && <TemplatesTab readOnly={isReadOnly} />}
          {activeTab === 'drills' && <DrillsTab readOnly={isReadOnly} />}
          {activeTab === 'marketplace' && isHeadCoach && <MarketplaceTab />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MasterDataPage;

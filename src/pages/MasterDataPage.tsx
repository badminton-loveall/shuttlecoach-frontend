import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CenterSettingsTab from '../components/CenterSettingsTab';
import { MarketplaceGallery } from '../components/MarketplaceGallery';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages.css';

export const MasterDataPage: React.FC = () => {
  const { role } = useAuth();
  const isHeadCoach = role === 'HEAD_COACH';

  const [activeTab, setActiveTab] = useState<'center' | 'marketplace'>('center');

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Settings</h1>
              <p className="page-header-subtitle">Manage center settings</p>
            </div>
          </div>

          <nav className="sp-tab-nav" role="tablist" aria-label="Settings tabs">
            <button role="tab" aria-selected={activeTab === 'center'} className={`sp-tab${activeTab === 'center' ? ' sp-tab--active' : ''}`} onClick={() => setActiveTab('center')}>
              Center
            </button>
            {isHeadCoach && (
              <button role="tab" aria-selected={activeTab === 'marketplace'} className={`sp-tab${activeTab === 'marketplace' ? ' sp-tab--active' : ''}`} onClick={() => setActiveTab('marketplace')}>
                Marketplace
              </button>
            )}
          </nav>

          {activeTab === 'center' && <CenterSettingsTab />}
          {activeTab === 'marketplace' && isHeadCoach && <MarketplaceGallery />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MasterDataPage;

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import CenterSettingsTab from '../components/CenterSettingsTab';
import { MarketplaceGallery } from '../components/MarketplaceGallery';
import SubscriptionCatalog from '../components/SubscriptionCatalog';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages.css';

type SettingsTab = 'center' | 'marketplace' | 'subscriptions';
const VALID_TABS: SettingsTab[] = ['center', 'marketplace', 'subscriptions'];

export const MasterDataPage: React.FC = () => {
  const { role } = useAuth();
  const isHeadCoach = role === 'HEAD_COACH';

  // Lets other pages deep-link straight into a tab, e.g. /master-data?tab=marketplace
  // from the dashboard's Marketplace stat card.
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    requestedTab && VALID_TABS.includes(requestedTab) ? requestedTab : 'center'
  );

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
            {isHeadCoach && (
              <button role="tab" aria-selected={activeTab === 'subscriptions'} className={`sp-tab${activeTab === 'subscriptions' ? ' sp-tab--active' : ''}`} onClick={() => setActiveTab('subscriptions')}>
                Subscriptions
              </button>
            )}
          </nav>

          {activeTab === 'center' && <CenterSettingsTab />}
          {activeTab === 'marketplace' && isHeadCoach && <MarketplaceGallery />}
          {activeTab === 'subscriptions' && isHeadCoach && <SubscriptionCatalog />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MasterDataPage;

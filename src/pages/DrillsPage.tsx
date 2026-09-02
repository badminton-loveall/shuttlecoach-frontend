import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { DrillsTab } from '../components/DrillsTab';
import { MarketplaceGallery } from '../components/MarketplaceGallery';
import { useAuth } from '../contexts/AuthContext';
import { useCenter } from '../hooks/useCenter';

type Tab = 'my-drills' | 'marketplace';

/**
 * DrillsPage
 * Standalone page for managing drills, accessible under Training menu.
 * HEAD_COACH gets full CRUD + Marketplace tab, ASSISTANT_COACH gets read-only drills.
 * The Marketplace tab (global drill pack, coach-built Drill Sets, and adopting
 * published sets from other centers) is only shown when the center's
 * ADMIN-controlled marketplace toggle is enabled.
 */
const DrillsPage: React.FC = () => {
  const { role } = useAuth();
  const { center } = useCenter();
  const isReadOnly = role !== 'HEAD_COACH';
  const isHeadCoach = role === 'HEAD_COACH';
  const marketplaceVisible = isHeadCoach && center?.marketplaceEnabled === true;
  const [activeTab, setActiveTab] = useState<Tab>('my-drills');

  return (
    <DashboardLayout>
      <div className="page-container">
        {isHeadCoach && (
          <div className="tab-bar">
            <button
              className={`tab-button ${activeTab === 'my-drills' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-drills')}
            >
              My Drills
            </button>
            {marketplaceVisible && (
              <button
                className={`tab-button ${activeTab === 'marketplace' ? 'active' : ''}`}
                onClick={() => setActiveTab('marketplace')}
              >
                Marketplace
              </button>
            )}
          </div>
        )}
        <div className="section-stack">
          {activeTab === 'my-drills' && <DrillsTab readOnly={isReadOnly} />}
          {activeTab === 'marketplace' && marketplaceVisible && <MarketplaceGallery />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DrillsPage;

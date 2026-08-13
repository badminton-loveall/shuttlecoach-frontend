import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { DrillsTab } from '../components/DrillsTab';
import { MarketplaceTab } from '../components/MarketplaceTab';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'my-drills' | 'marketplace';

/**
 * DrillsPage
 * Standalone page for managing drills, accessible under Training menu.
 * HEAD_COACH gets full CRUD + marketplace tab, ASSISTANT_COACH gets read-only view.
 *
 * Requirements: 5.6
 */
const DrillsPage: React.FC = () => {
  const { role } = useAuth();
  const isReadOnly = role !== 'HEAD_COACH';
  const isHeadCoach = role === 'HEAD_COACH';
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
            <button
              className={`tab-button ${activeTab === 'marketplace' ? 'active' : ''}`}
              onClick={() => setActiveTab('marketplace')}
            >
              Marketplace
            </button>
          </div>
        )}
        <div className="section-stack">
          {activeTab === 'my-drills' && <DrillsTab readOnly={isReadOnly} />}
          {activeTab === 'marketplace' && isHeadCoach && <MarketplaceTab />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DrillsPage;

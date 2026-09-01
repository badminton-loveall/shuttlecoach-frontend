import React from 'react';
import MarketplaceTab from './MarketplaceTab';
import MySetsTab from './MySetsTab';
import CommunitySetsTab from './CommunitySetsTab';

/**
 * MarketplacePanel Component
 * Everything under the Drills page's single "Marketplace" tab:
 * the admin-curated global drill pack, the coach's own Drill Sets
 * (built via "+ Add Drills"), and published sets from other centers.
 */
export const MarketplacePanel: React.FC = () => {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Global Drill Pack</h2>
        <MarketplaceTab />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">My Sets</h2>
        <MySetsTab />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Available From Other Centers</h2>
        <CommunitySetsTab />
      </section>
    </div>
  );
};

export default MarketplacePanel;

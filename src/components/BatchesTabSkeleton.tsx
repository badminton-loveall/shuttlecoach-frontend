import React from 'react';
import './CoachProfile.css';

/**
 * BatchesTabSkeleton Component
 * Displays loading skeleton for the Batches tab while data is being fetched
 * Shows placeholder content with pulse animation using Tailwind CSS
 * Requirements: 24.1
 */

export const BatchesTabSkeleton: React.FC = () => {
  return (
    <div className="coach-profile-tab-content">
      <div className="tab-header">
        <div className="skeleton-line skeleton-line--lg" style={{ width: '200px' }} />
      </div>

      {/* Batch List Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-hover)',
            }}
          >
            {/* Batch avatar placeholder */}
            <div
              className="animate-pulse"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--surface-card)',
                flexShrink: 0,
              }}
            />

            {/* Batch info */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="skeleton-line skeleton-line--sm" style={{ width: '180px' }} />
              <div className="skeleton-line skeleton-line--xs" style={{ width: '140px' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="skeleton-line skeleton-line--xs" style={{ width: '100px' }} />
                <div className="skeleton-line skeleton-line--xs" style={{ width: '100px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchesTabSkeleton;

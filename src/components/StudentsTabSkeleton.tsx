import React from 'react';
import './CoachProfile.css';

/**
 * StudentsTabSkeleton Component
 * Displays loading skeleton for the Students tab while data is being fetched
 * Shows placeholder content with pulse animation using Tailwind CSS
 * Requirements: 24.1
 */

export const StudentsTabSkeleton: React.FC = () => {
  return (
    <div className="coach-profile-tab-content">
      <div className="tab-header">
        <div className="skeleton-line skeleton-line--lg" style={{ width: '200px' }} />
      </div>

      {/* Filter Section Skeleton */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '12px',
          background: 'var(--surface-hover)',
          borderRadius: 'var(--radius-md)',
          flexWrap: 'wrap',
        }}
      >
        {[1, 2, 3].map((index) => (
          <div key={index} className="skeleton-line skeleton-line--sm" style={{ width: '150px', height: '36px' }} />
        ))}
      </div>

      {/* Students Grid Skeleton */}
      <div className="students-list">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="student-card"
            style={{
              opacity: 0.6,
            }}
          >
            {/* Student avatar placeholder */}
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

            {/* Student info skeleton */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="skeleton-line skeleton-line--sm" style={{ width: '140px' }} />
              <div className="skeleton-line skeleton-line--xs" style={{ width: '100px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="skeleton-line skeleton-line--xs" style={{ width: '80px' }} />
                <div className="skeleton-line skeleton-line--xs" style={{ width: '80px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentsTabSkeleton;

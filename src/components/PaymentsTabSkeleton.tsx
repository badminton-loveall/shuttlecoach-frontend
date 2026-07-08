import React from 'react';
import './CoachProfile.css';

/**
 * PaymentsTabSkeleton Component
 * Displays loading skeleton for the Payments tab while data is being fetched
 * Shows placeholder content with pulse animation using Tailwind CSS
 * Requirements: 24.1
 */

export const PaymentsTabSkeleton: React.FC = () => {
  return (
    <div className="coach-profile-tab-content">
      <div className="tab-header">
        <div className="skeleton-line skeleton-line--lg" style={{ width: '300px' }} />
      </div>

      {/* Filter Section Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          padding: '12px',
          background: 'var(--surface-hover)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div key={index} className="skeleton-line skeleton-line--sm" style={{ height: '36px' }} />
        ))}
      </div>

      {/* Statistics Cards Skeleton */}
      <div className="payment-stats-grid">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div
            key={index}
            className="stat-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div className="skeleton-line skeleton-line--xs" style={{ width: '80px' }} />
            <div className="skeleton-line skeleton-line--lg" style={{ width: '120px' }} />
          </div>
        ))}
      </div>

      {/* Income Table Skeleton */}
      <section className="payment-section" style={{ marginTop: '16px' }}>
        <div className="skeleton-line skeleton-line--base" style={{ width: '150px', marginBottom: '12px' }} />
        <div
          style={{
            overflow: 'hidden',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {/* Table Header Skeleton */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '12px',
                padding: '10px 12px',
                background: 'var(--surface-hover)',
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="skeleton-line skeleton-line--xs" style={{ width: '100%', height: '16px' }} />
              ))}
            </div>

            {/* Table Row Skeletons */}
            {[1, 2, 3].map((rowIndex) => (
              <div
                key={rowIndex}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '12px',
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border-default)',
                  background: 'var(--surface-card)',
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((colIndex) => (
                  <div key={colIndex} className="skeleton-line skeleton-line--sm" style={{ width: '100%', height: '18px' }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expense Ledger Skeleton */}
      <section className="payment-section" style={{ marginTop: '24px' }}>
        <div className="skeleton-line skeleton-line--base" style={{ width: '150px', marginBottom: '12px' }} />
        <div
          style={{
            overflow: 'hidden',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {/* Table Header Skeleton */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '12px',
                padding: '10px 12px',
                background: 'var(--surface-hover)',
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="skeleton-line skeleton-line--xs" style={{ width: '100%', height: '16px' }} />
              ))}
            </div>

            {/* Table Row Skeletons */}
            {[1, 2, 3].map((rowIndex) => (
              <div
                key={rowIndex}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '12px',
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border-default)',
                  background: 'var(--surface-card)',
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((colIndex) => (
                  <div key={colIndex} className="skeleton-line skeleton-line--sm" style={{ width: '100%', height: '18px' }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PaymentsTabSkeleton;

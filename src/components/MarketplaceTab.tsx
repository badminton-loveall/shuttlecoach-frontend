import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../hooks/useMarketplace';
import '../styles/pages.css';

/**
 * MarketplaceTab Component
 * Shows drill packages as cards that can be adopted in one click.
 * Each package represents a sport's full drill set.
 *
 * Requirements: 5.6, 5.7, 6.1, 6.6
 */

export const MarketplaceTab: React.FC = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [adopting, setAdopting] = useState(false);
  const [adoptError, setAdoptError] = useState<string | null>(null);
  const [adopted, setAdopted] = useState(false);

  const { drills, loading, error, refetch } = useMarketplace({});

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (adoptError) {
      const timer = setTimeout(() => setAdoptError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [adoptError]);

  // Group drills by category for display
  const categoryCounts: Record<string, number> = {};
  drills.forEach((drill) => {
    const cat = drill.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const totalDrills = drills.length;
  const allAdopted = totalDrills === 0 && !loading && !error;

  const handleAdoptAll = async () => {
    setAdopting(true);
    setAdoptError(null);
    try {
      const { default: apiClient } = await import('../utils/apiClient');
      const response = await apiClient.post('/drills/adopt-all');
      const data = response.data as { adopted: number; message: string };
      setSuccessMessage(`${data.adopted} drills added to your library!`);
      setAdopted(true);
      await refetch();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setAdoptError(axiosErr.response?.data?.error || 'Failed to adopt drills. Please try again.');
      } else {
        setAdoptError('Failed to adopt drills. Please try again.');
      }
    } finally {
      setAdopting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Loading marketplace...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-error, #ef4444)', marginBottom: '12px' }}>{error}</p>
        <button onClick={refetch} style={secondaryBtnStyle}>Retry</button>
      </div>
    );
  }

  // All adopted state
  if (allAdopted || adopted) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        {successMessage && (
          <div style={successBannerStyle}>{successMessage}</div>
        )}
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>All drills adopted</h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Your drill library is up to date. Check the "My Drills" tab to see them.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Success / Error banners */}
      {successMessage && <div style={successBannerStyle}>{successMessage}</div>}
      {adoptError && <div style={errorBannerStyle}>{adoptError}</div>}

      {/* Package Card */}
      <div style={packageCardStyle}>
        {/* Icon + Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={iconStyle}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <path d="M8 14l4-3 4 3" />
              <path d="M6 19l2-5" />
              <path d="M18 19l-2-5" />
              <path d="M9 17h6" />
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Badminton Drill Pack
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              {totalDrills} drills across {Object.keys(categoryCounts).length} categories
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        <div style={categoryGridStyle}>
          {Object.entries(categoryCounts).map(([category, count]) => (
            <div key={category} style={categoryChipStyle}>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{category}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{count} drills</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '16px 0 20px' }}>
          Complete badminton training drill set including service, returns, forehand, backhand, and round head techniques. 
          Adopt the entire pack to instantly populate your drill library.
        </p>

        {/* CTA */}
        <button
          onClick={handleAdoptAll}
          disabled={adopting}
          style={adoptBtnStyle}
        >
          {adopting ? (
            <>
              <span style={spinnerStyle} />
              Adopting...
            </>
          ) : (
            <>🏸 Adopt All {totalDrills} Drills</>
          )}
        </button>
      </div>
    </div>
  );
};

// --- Inline styles ---

const packageCardStyle: React.CSSProperties = {
  background: 'var(--surface-default, #fff)',
  border: '1px solid var(--border-default)',
  borderRadius: '12px',
  padding: '28px',
  maxWidth: '560px',
};

const iconStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '12px',
  background: 'rgba(184, 225, 53, 0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#7a9e1e',
  flexShrink: 0,
};

const categoryGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
};

const categoryChipStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: '8px 14px',
  background: 'var(--surface-muted, #f9fafb)',
  borderRadius: '8px',
  fontSize: '13px',
};

const adoptBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 24px',
  background: '#B8E135',
  color: '#111827',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const spinnerStyle: React.CSSProperties = {
  width: '14px',
  height: '14px',
  border: '2px solid rgba(17, 24, 39, 0.3)',
  borderTopColor: '#111827',
  borderRadius: '50%',
  animation: 'spin 0.6s linear infinite',
};

const successBannerStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: 'rgba(34, 197, 94, 0.08)',
  border: '1px solid rgba(34, 197, 94, 0.2)',
  borderRadius: '8px',
  color: '#15803d',
  fontSize: '14px',
  marginBottom: '16px',
};

const errorBannerStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: 'rgba(239, 68, 68, 0.08)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: '8px',
  color: '#dc2626',
  fontSize: '14px',
  marginBottom: '16px',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid var(--border-default)',
  borderRadius: '6px',
  fontSize: '14px',
  cursor: 'pointer',
};

export default MarketplaceTab;

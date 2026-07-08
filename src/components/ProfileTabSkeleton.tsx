import React from 'react';
import './CoachProfile.css';

/**
 * ProfileTabSkeleton Component
 * Displays loading skeleton for the Profile tab while data is being fetched
 * Shows placeholder content with pulse animation using Tailwind CSS
 * Requirements: 24.1
 */

export const ProfileTabSkeleton: React.FC = () => {
  return (
    <div className="coach-profile-tab-content">
      <div className="tab-header">
        <div className="skeleton-line skeleton-line--lg" style={{ width: '200px' }} />
      </div>

      {/* Profile Details Section */}
      <div className="coach-profile-details">
        {/* Name field */}
        <div className="detail-group">
          <div className="skeleton-line skeleton-line--xs" style={{ width: '80px' }} />
          <div className="skeleton-line skeleton-line--sm" style={{ width: '150px', marginTop: '8px' }} />
        </div>

        {/* Email field */}
        <div className="detail-group">
          <div className="skeleton-line skeleton-line--xs" style={{ width: '80px' }} />
          <div className="skeleton-line skeleton-line--sm" style={{ width: '180px', marginTop: '8px' }} />
        </div>

        {/* Phone field */}
        <div className="detail-group">
          <div className="skeleton-line skeleton-line--xs" style={{ width: '80px' }} />
          <div className="skeleton-line skeleton-line--sm" style={{ width: '140px', marginTop: '8px' }} />
        </div>

        {/* Specialization field */}
        <div className="detail-group">
          <div className="skeleton-line skeleton-line--xs" style={{ width: '80px' }} />
          <div className="skeleton-line skeleton-line--sm" style={{ width: '160px', marginTop: '8px' }} />
        </div>

        {/* Qualifications field */}
        <div className="detail-group">
          <div className="skeleton-line skeleton-line--xs" style={{ width: '80px' }} />
          <div className="skeleton-line skeleton-line--sm" style={{ width: '170px', marginTop: '8px' }} />
        </div>

        {/* Certifications field */}
        <div className="detail-group">
          <div className="skeleton-line skeleton-line--xs" style={{ width: '80px' }} />
          <div className="skeleton-line skeleton-line--sm" style={{ width: '140px', marginTop: '8px' }} />
        </div>
      </div>

      {/* Role Section */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
        <div className="skeleton-line skeleton-line--xs" style={{ width: '80px' }} />
        <div className="skeleton-line skeleton-line--sm" style={{ width: '100%', marginTop: '8px' }} />
        <div className="skeleton-line skeleton-line--sm" style={{ width: '90%', marginTop: '8px' }} />
      </div>
    </div>
  );
};

export default ProfileTabSkeleton;

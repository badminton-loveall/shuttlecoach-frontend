import React, { useState, useRef, useEffect } from 'react';
import { useAuth, useSwitchCenter } from '../contexts/AuthContext';
import './CenterSwitcher.css';

/**
 * CenterSwitcher Component
 * Displays the active center name in the header. If the user has multiple
 * memberships, renders a dropdown to switch between centers.
 * If only one membership, renders the center name as plain text.
 *
 * Requirements: 2.1, 2.2, 2.4, 2.6
 */
const CenterSwitcher: React.FC = () => {
  const { memberships, activeCenterId } = useAuth();
  const switchCenter = useSwitchCenter();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // No memberships — render nothing
  if (!memberships || memberships.length === 0) {
    return null;
  }

  const activeMembership = memberships.find((m) => m.centerId === activeCenterId);
  const activeName = activeMembership?.centerName || 'Select Center';

  // Single membership — render plain text (no dropdown)
  if (memberships.length === 1) {
    return (
      <div className="center-switcher center-switcher--single">
        <span className="center-switcher__name">{activeName}</span>
      </div>
    );
  }

  // Multiple memberships — render dropdown
  const handleSelect = (centerId: string) => {
    if (centerId !== activeCenterId) {
      switchCenter(centerId);
    }
    setIsOpen(false);
  };

  return (
    <div className="center-switcher" ref={containerRef}>
      <button
        className="center-switcher__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Switch center. Current: ${activeName}`}
        title="Switch center"
      >
        <span className="center-switcher__name">{activeName}</span>
        <svg
          className={`center-switcher__chevron ${isOpen ? 'center-switcher__chevron--open' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="center-switcher__dropdown" role="listbox" aria-label="Available centers">
          {memberships.map((membership, index) => (
            <button
              key={`${membership.centerId}-${index}`}
              className={`center-switcher__option ${
                membership.centerId === activeCenterId ? 'center-switcher__option--active' : ''
              }`}
              role="option"
              aria-selected={membership.centerId === activeCenterId}
              onClick={() => handleSelect(membership.centerId)}
            >
              <span className="center-switcher__option-name">{membership.centerName}</span>
              {membership.centerId === activeCenterId && (
                <svg
                  className="center-switcher__check-icon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CenterSwitcher;

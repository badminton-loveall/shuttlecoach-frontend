import React, { useState } from 'react';
import './CollapsibleFilterPanel.css';

interface CollapsibleFilterPanelProps {
  children: React.ReactNode;
  activeFilterCount?: number;
  title?: string;
  triggerRef?: React.Ref<HTMLButtonElement>;
  onClose?: () => void;
}

export const CollapsibleFilterPanel: React.FC<CollapsibleFilterPanelProps> = ({
  children,
  activeFilterCount = 0,
  title = 'Filters',
  triggerRef,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <>
      <button
        ref={triggerRef}
        className="filter-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle filters"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.586a1 1 0 0 1-.293.707l-6.414 6.414a1 1 0 0 0-.293.707V17l-4 4v-6.586a1 1 0 0 0-.293-.707L3.293 7.293A1 1 0 0 1 3 6.586V4z" />
        </svg>
        {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
      </button>

      {isOpen && (
        <div className="filter-panel-backdrop" onClick={handleClose}>
          <div className="filter-panel-compact" onClick={(e) => e.stopPropagation()}>
            <div className="filter-panel-header">
              <h3 className="filter-panel-title">{title}</h3>
              <button
                className="filter-panel-close-btn"
                onClick={handleClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="filter-panel-body">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CollapsibleFilterPanel;

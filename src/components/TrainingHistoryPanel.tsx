import React from 'react';
import './TrainingTab.css';

/**
 * TrainingHistoryPanel Component
 * Displays an expandable per-drill date list showing when a specific drill was trained.
 * Rendered inline below the selected drill row in the Drill Skills Matrix grid.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

export interface TrainingHistoryPanelProps {
  /** Display name of the selected drill */
  drillName: string;
  /** Training dates for this drill — sourced from skill scores filtered by drill's skill ID */
  trainingDates: Array<{ date: string; score?: number }>;
  /** Whether the panel is expanded */
  isOpen: boolean;
}

export const TrainingHistoryPanel: React.FC<TrainingHistoryPanelProps> = ({
  drillName,
  trainingDates,
  isOpen,
}) => {
  if (!isOpen) {
    return null;
  }

  // Sort dates descending (most recent first) — Requirement 3.2
  const sortedDates = [...trainingDates].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div
      className="training-history-panel"
      role="region"
      aria-label={`Training history for ${drillName}`}
    >
      <div className="training-history-panel__title">Training History</div>

      {sortedDates.length === 0 ? (
        <p className="training-history-panel__empty">
          No training sessions recorded for this drill.
        </p>
      ) : (
        <div className="training-history-panel__dates">
          {sortedDates.map((entry, index) => (
            <span key={`${entry.date}-${index}`} className="training-history-panel__date">
              {formatDisplayDate(entry.date)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Format an ISO date string into a readable short date (e.g. "15 Jan 2025").
 */
function formatDisplayDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    return isoDate; // fallback to raw string if parse fails
  }
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default TrainingHistoryPanel;

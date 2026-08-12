/**
 * CoachDayDetailPanel Component
 * Displays a detail panel for a selected day in the coach calendar.
 * Shows batch cards with batch name, time range, focus area, and color indicator.
 * Each batch card renders a BatchStudentList placeholder (to be wired in Task 9.3).
 *
 * Requirements: 3.1, 3.2, 3.5
 */

import React from 'react';
import { BatchStudentList } from './BatchStudentList';
import './CoachDayDetailPanel.css';

export interface CoachBatchEntry {
  batchId: string;
  batchName: string;
  batchColor: string;
  startTime: string;
  endTime: string;
  focusArea: string;
}

export interface CoachDayDetailPanelProps {
  date: string;
  batchEntries: CoachBatchEntry[];
  onClose: () => void;
}

/**
 * Format an ISO date string (YYYY-MM-DD) into a readable format like "Monday, 4 August 2026".
 */
function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format time to "HH:MM" 24-hour display.
 * Input is already in "HH:MM" format, so just pass through.
 */
function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}

export const CoachDayDetailPanel: React.FC<CoachDayDetailPanelProps> = ({
  date,
  batchEntries,
  onClose,
}) => {
  return (
    <div className="coach-day-detail-panel">
      {/* Panel Header */}
      <div className="coach-day-detail-panel__header">
        <h3 className="coach-day-detail-panel__title">{formatDateDisplay(date)}</h3>
        <button
          type="button"
          className="coach-day-detail-panel__close-btn"
          onClick={onClose}
          aria-label="Close panel"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Batch Cards */}
      <div className="coach-day-detail-panel__body">
        {batchEntries.length === 0 && (
          <p className="coach-day-detail-panel__empty">No sessions scheduled for this day.</p>
        )}

        {batchEntries.map((entry) => (
          <div key={entry.batchId} className="coach-day-detail-panel__batch-card">
            {/* Batch card header with color indicator */}
            <div className="coach-day-detail-panel__batch-header">
              <span
                className="coach-day-detail-panel__color-indicator"
                style={{ backgroundColor: entry.batchColor }}
              />
              <div className="coach-day-detail-panel__batch-info">
                <span className="coach-day-detail-panel__batch-name">{entry.batchName}</span>
                <span className="coach-day-detail-panel__batch-time">
                  {formatTimeRange(entry.startTime, entry.endTime)}
                </span>
              </div>
            </div>

            {/* Focus area */}
            {entry.focusArea && (
              <div className="coach-day-detail-panel__focus-area">
                <span className="coach-day-detail-panel__focus-label">Focus:</span>{' '}
                {entry.focusArea}
              </div>
            )}

            {/* BatchStudentList — renders student drill accordions for this batch */}
            <BatchStudentList
              batchId={entry.batchId}
              date={date}
              batchColor={entry.batchColor}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoachDayDetailPanel;

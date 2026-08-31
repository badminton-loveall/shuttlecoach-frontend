import type { CalendarEntry } from '../../types';
import '../StudentDrillDrawer.css';

interface DetailPanelProps {
  entries: CalendarEntry[];
  date: string;
  onClose: () => void;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a human-friendly label,
 * e.g. "Monday, 4 August 2026".
 */
function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats a time range, e.g. "09:00 – 11:00".
 */
function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}

/**
 * Slide-over drawer showing a day's session(s) and drills — reuses the same
 * visual pattern (and CSS classes) as the dashboard's StudentDrillDrawer so a
 * click on any calendar cell feels consistent with the dashboard's drill panel.
 */
export default function DetailPanel({ entries, date, onClose }: DetailPanelProps) {
  return (
    <>
      <div className="student-drill-drawer__backdrop" onClick={onClose} aria-hidden="true" />

      <aside
        className="student-drill-drawer"
        role="dialog"
        aria-label={`Schedule for ${formatDateLabel(date)}`}
        aria-modal="true"
      >
        <div className="student-drill-drawer__header">
          <div className="student-drill-drawer__student-info">
            <h2 className="student-drill-drawer__name">{formatDateLabel(date)}</h2>
          </div>
          <button
            type="button"
            className="student-drill-drawer__close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="student-drill-drawer__body">
          {entries.map((entry, index) => (
            <div className="student-drill-drawer__focus-group" key={index}>
              <h3 className="student-drill-drawer__focus-label">
                {formatTimeRange(entry.startTime, entry.endTime)}
                {entry.focusArea ? ` · ${entry.focusArea}` : ''}
              </h3>
              {entry.drills.length > 0 ? (
                <ul className="student-drill-drawer__drill-list">
                  {entry.drills.map((drill, drillIndex) => (
                    <li className="student-drill-drawer__drill-item" key={drillIndex}>
                      {drill}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="student-drill-drawer__empty-text">No drills assigned</p>
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

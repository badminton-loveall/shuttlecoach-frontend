import { useEffect, useRef } from 'react';
import type { CalendarEntry } from '../../types';

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

export default function DetailPanel({ entries, date, onClose }: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="detail-panel" ref={panelRef}>
      <div className="detail-panel__header">
        <span className="detail-panel__date">{formatDateLabel(date)}</span>
        <button
          className="detail-panel__close-btn"
          onClick={onClose}
          aria-label="Close detail panel"
          type="button"
        >
          ✕
        </button>
      </div>

      {entries.map((entry, index) => (
        <div className="detail-panel__session" key={index}>
          <div className="detail-panel__session-time">
            {formatTimeRange(entry.startTime, entry.endTime)}
          </div>

          {entry.focusArea && (
            <div className="detail-panel__session-focus">{entry.focusArea}</div>
          )}

          <div className="detail-panel__drills">
            {entry.drills.length > 0 ? (
              entry.drills.map((drill, drillIndex) => (
                <span className="detail-panel__drill-item" key={drillIndex}>
                  {drill}
                </span>
              ))
            ) : (
              <span className="detail-panel__drills--empty">No drills assigned</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

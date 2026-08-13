import React from 'react';
import type { CalendarEntry } from '../../types';

export interface SessionTabBarProps {
  sessions: CalendarEntry[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Format a time string (HH:MM) into a readable 12-hour format.
 */
function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

/**
 * SessionTabBar displays today's sessions as horizontal scrollable chips/pills.
 * - The selected session is highlighted with the primary color.
 * - Sessions with attendance already recorded show a ✓ checkmark.
 * - Each chip shows: batchName · startTime - endTime
 */
export const SessionTabBar: React.FC<SessionTabBarProps> = ({
  sessions,
  selectedIndex,
  onSelect,
}) => {
  if (sessions.length === 0) return null;

  return (
    <div
      style={containerStyle}
      role="tablist"
      aria-label="Session tabs"
    >
      {sessions.map((session, index) => {
        const isSelected = index === selectedIndex;
        const isRecorded = session.attendanceRecorded;

        return (
          <button
            key={`${session.batchId}-${session.startTime}`}
            role="tab"
            aria-selected={isSelected}
            aria-label={`${session.batchName} ${formatTime(session.startTime)} to ${formatTime(session.endTime)}${isRecorded ? ', attendance recorded' : ', attendance pending'}`}
            onClick={() => onSelect(index)}
            style={{
              ...chipBaseStyle,
              ...(isSelected ? chipSelectedStyle : chipUnselectedStyle),
            }}
          >
            {isRecorded && (
              <span style={checkmarkStyle} aria-hidden="true">✓</span>
            )}
            <span style={chipTextStyle}>
              {session.batchName} · {formatTime(session.startTime)} – {formatTime(session.endTime)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* --------------------------------------------------------------------------
   Styles
   -------------------------------------------------------------------------- */

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: '0.5rem',
  overflowX: 'auto',
  paddingBottom: '0.25rem',
  scrollbarWidth: 'thin',
};

const chipBaseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.5rem 0.875rem',
  borderRadius: 'var(--radius)',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.8125rem',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  transition: 'background-color 0.15s ease, color 0.15s ease',
  flexShrink: 0,
};

const chipSelectedStyle: React.CSSProperties = {
  backgroundColor: 'hsl(var(--primary))',
  color: 'hsl(var(--primary-foreground))',
};

const chipUnselectedStyle: React.CSSProperties = {
  backgroundColor: 'hsl(var(--muted))',
  color: 'hsl(var(--muted-foreground))',
};

const checkmarkStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  lineHeight: 1,
};

const chipTextStyle: React.CSSProperties = {
  lineHeight: 1.2,
};

export default SessionTabBar;

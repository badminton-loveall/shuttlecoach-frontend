import React, { useState } from 'react';
import type { GridDay } from './calendarUtils';
import type { CalendarEntry, SkillLevel } from '../../types';
import { SKILL_LEVEL_CLASS_MAP } from '../../utils/batchColors';

interface DayCellProps {
  day: GridDay;
  hasEntries: boolean;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
  skillLevel?: SkillLevel;
  batchColors?: Array<{ batchId: string; batchName: string; color: string }>;
  entries?: CalendarEntry[];
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  hasEntries,
  isSelected,
  isToday,
  onClick,
  skillLevel,
  batchColors,
  entries,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const classNames = ['day-cell'];

  if (!day.isCurrentMonth) {
    classNames.push('day-cell--muted');
  }

  if (isToday) {
    classNames.push('day-cell--today');
  }

  if (hasEntries && day.isCurrentMonth) {
    if (skillLevel) {
      classNames.push(SKILL_LEVEL_CLASS_MAP[skillLevel]);
    } else {
      classNames.push('day-cell--highlighted');
    }
  }

  if (isSelected) {
    classNames.push('day-cell--selected');
  }

  const handleClick = () => {
    if (day.isCurrentMonth) {
      onClick();
    }
  };

  return (
    <div
      className={classNames.join(' ')}
      onClick={handleClick}
      onMouseEnter={() => hasEntries && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {day.dayNumber}
      {batchColors && batchColors.length > 0 && (
        <div className="day-cell__dots">
          {batchColors.map(bc => (
            <span key={bc.batchId} className="day-cell__dot" style={{ backgroundColor: bc.color }} title={bc.batchName} />
          ))}
        </div>
      )}
      {showTooltip && entries && entries.length > 0 && (
        <div className="day-cell__tooltip">
          <div className="day-cell__tooltip-heading">
            {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
          {entries.map((entry, idx) => (
            <div key={idx} className="day-cell__tooltip-entry">
              <div className="day-cell__tooltip-time">🕐 {entry.startTime} – {entry.endTime}</div>
              {entry.weekNumber != null && (
                <div className="day-cell__tooltip-week">Week {entry.weekNumber} · {entry.batchName}</div>
              )}
              {entry.focusArea && <div className="day-cell__tooltip-focus">📌 {entry.focusArea}</div>}
              {entry.drills && entry.drills.length > 0 && (
                <div className="day-cell__tooltip-drills">
                  {entry.drills.map((drill, i) => (
                    <span key={i} className="day-cell__tooltip-drill">• {drill}</span>
                  ))}
                </div>
              )}
              {(!entry.drills || entry.drills.length === 0) && (
                <div className="day-cell__tooltip-no-drills">No drills assigned</div>
              )}
              {entry.coachNote && (
                <div className="day-cell__tooltip-note">💬 {entry.coachNote}</div>
              )}
              {entry.attendanceRecorded && (
                <div className="day-cell__tooltip-attendance">✓ Attendance recorded</div>
              )}
              <div className="day-cell__tooltip-hint">Click for full details →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(DayCell);

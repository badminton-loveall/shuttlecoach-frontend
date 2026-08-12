import React from 'react';
import type { GridDay } from './calendarUtils';
import type { SkillLevel } from '../../types';
import { SKILL_LEVEL_CLASS_MAP } from '../../utils/batchColors';

interface DayCellProps {
  day: GridDay;
  hasEntries: boolean;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
  skillLevel?: SkillLevel;
  batchColors?: Array<{ batchId: string; batchName: string; color: string }>;
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  hasEntries,
  isSelected,
  isToday,
  onClick,
  skillLevel,
  batchColors,
}) => {
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
    <div className={classNames.join(' ')} onClick={handleClick}>
      {day.dayNumber}
      {batchColors && batchColors.length > 0 && (
        <div className="day-cell__dots">
          {batchColors.map(bc => (
            <span key={bc.batchId} className="day-cell__dot" style={{ backgroundColor: bc.color }} title={bc.batchName} />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(DayCell);

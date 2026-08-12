import React from 'react';
import type { GridDay } from './calendarUtils';

interface DayCellProps {
  day: GridDay;
  hasEntries: boolean;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  hasEntries,
  isSelected,
  isToday,
  onClick,
}) => {
  const classNames = ['day-cell'];

  if (!day.isCurrentMonth) {
    classNames.push('day-cell--muted');
  }

  if (isToday) {
    classNames.push('day-cell--today');
  }

  if (hasEntries && day.isCurrentMonth) {
    classNames.push('day-cell--highlighted');
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
    </div>
  );
};

export default React.memo(DayCell);

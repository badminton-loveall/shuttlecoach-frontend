import React from 'react';
import type { GridDay } from './calendarUtils';
import type { CalendarEntry } from '../../types';
import DayCell from './DayCell';

interface CalendarGridProps {
  days: GridDay[];
  entriesByDate: Map<string, CalendarEntry[]>;
  selectedDate: string | null;
  today: string;
  onDayClick: (date: string) => void;
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  entriesByDate,
  selectedDate,
  today,
  onDayClick,
}) => {
  return (
    <div className="calendar-grid">
      {WEEKDAY_HEADERS.map((header) => (
        <div key={header} className="calendar-grid__header">
          {header}
        </div>
      ))}
      {days.map((day) => (
        <DayCell
          key={day.date}
          day={day}
          hasEntries={
            entriesByDate.has(day.date) &&
            (entriesByDate.get(day.date)?.length ?? 0) > 0
          }
          isSelected={day.date === selectedDate}
          isToday={day.date === today}
          onClick={() => onDayClick(day.date)}
        />
      ))}
    </div>
  );
};

export default React.memo(CalendarGrid);

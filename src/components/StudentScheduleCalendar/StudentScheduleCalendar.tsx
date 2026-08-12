import { useState, useMemo, useCallback } from 'react';
import { useSessionCalendar } from '../../hooks/useSessionSchedule';
import {
  buildGridDays,
  buildEntriesMap,
  getMonthDateRange,
  getToday,
} from './calendarUtils';
import MonthNavigator from './MonthNavigator';
import CalendarGrid from './CalendarGrid';
import DetailPanel from './DetailPanel';
import './StudentScheduleCalendar.css';

interface StudentScheduleCalendarProps {
  batchId: string; // empty string means no batch assigned
}

export default function StudentScheduleCalendar({
  batchId,
}: StudentScheduleCalendarProps) {
  const now = new Date();
  const [viewedYear, setViewedYear] = useState(now.getFullYear());
  const [viewedMonth, setViewedMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Compute date range for the viewed month
  const { startDate, endDate } = useMemo(
    () => getMonthDateRange(viewedYear, viewedMonth),
    [viewedYear, viewedMonth]
  );

  // Fetch calendar entries via hook
  const { entries, loading } = useSessionCalendar({ startDate, endDate, batchId });

  // Computed values
  const gridDays = useMemo(
    () => buildGridDays(viewedYear, viewedMonth),
    [viewedYear, viewedMonth]
  );

  const entriesByDate = useMemo(() => buildEntriesMap(entries), [entries]);

  const today = useMemo(() => getToday(), []);

  // Month navigation handlers
  const handlePrev = useCallback(() => {
    setViewedMonth((prev) => {
      if (prev === 0) {
        setViewedYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
    setSelectedDate(null);
  }, []);

  const handleNext = useCallback(() => {
    setViewedMonth((prev) => {
      if (prev === 11) {
        setViewedYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
    setSelectedDate(null);
  }, []);

  // Day click handler
  const handleDayClick = useCallback(
    (date: string) => {
      const dayEntries = entriesByDate.get(date);
      if (dayEntries && dayEntries.length > 0) {
        setSelectedDate(date);
      } else {
        setSelectedDate(null);
      }
    },
    [entriesByDate]
  );

  // Close detail panel
  const handleCloseDetail = useCallback(() => {
    setSelectedDate(null);
  }, []);

  // No batch assigned state
  if (!batchId) {
    return (
      <div className="student-schedule-calendar student-schedule-calendar--empty">
        <p>No batch assigned yet. Select a batch above to see the training calendar.</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="student-schedule-calendar student-schedule-calendar--loading">
        <div className="student-schedule-calendar__loader" aria-label="Loading calendar">
          Loading...
        </div>
      </div>
    );
  }

  // Check if there are any highlighted days this month
  const hasSessionsThisMonth = entries.length > 0;

  return (
    <div className="student-schedule-calendar">
      <MonthNavigator
        year={viewedYear}
        month={viewedMonth}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <CalendarGrid
        days={gridDays}
        entriesByDate={entriesByDate}
        selectedDate={selectedDate}
        today={today}
        onDayClick={handleDayClick}
      />

      {!hasSessionsThisMonth && (
        <p className="student-schedule-calendar__no-sessions">
          No sessions scheduled this month
        </p>
      )}

      {selectedDate && entriesByDate.has(selectedDate) && (
        <DetailPanel
          entries={entriesByDate.get(selectedDate)!}
          date={selectedDate}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSessionCalendar } from '../../hooks/useSessionSchedule';
import {
  buildGridDays,
  buildEntriesMap,
  getMonthDateRange,
  getToday,
  formatDate,
} from './calendarUtils';
import MonthNavigator from './MonthNavigator';
import CalendarGrid from './CalendarGrid';
import DetailPanel from './DetailPanel';
import apiClient from '../../utils/apiClient';
import './StudentScheduleCalendar.css';
import type { SkillLevel } from '../../types';

/** How far ahead to look for the student's first curriculum-covered session. */
const AUTO_NAVIGATE_PROBE_DAYS = 90;

interface StudentScheduleCalendarProps {
  batchId: string; // empty string means no batch assigned
  skillLevel?: SkillLevel;
  studentId?: string; // when provided, drills come from this student's own curriculum plan
}

export default function StudentScheduleCalendar({
  batchId,
  skillLevel,
  studentId,
}: StudentScheduleCalendarProps) {
  const now = new Date();
  const [viewedYear, setViewedYear] = useState(now.getFullYear());
  const [viewedMonth, setViewedMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // If today's month has no curriculum-covered sessions but a nearby future month does,
  // open the calendar there instead — otherwise a newly enrolled student's schedule looks
  // completely empty until the coach happens to click "next month". Tracked per-studentId
  // (rather than a plain boolean) so switching to a different student without a full
  // remount still re-probes instead of silently reusing the previous student's result.
  const autoNavigatedForStudent = useRef<string | null>(null);
  const userNavigated = useRef(false);
  useEffect(() => {
    if (!studentId || autoNavigatedForStudent.current === studentId) return;
    autoNavigatedForStudent.current = studentId;
    userNavigated.current = false;

    const probeStart = new Date();
    const probeEnd = new Date();
    probeEnd.setDate(probeEnd.getDate() + AUTO_NAVIGATE_PROBE_DAYS);

    apiClient
      .get<{ sessions?: Array<{ date: string; weekNumber?: number }> }>('/session-calendar', {
        params: {
          studentId,
          startDate: formatDate(probeStart),
          endDate: formatDate(probeEnd),
        },
      })
      .then((res) => {
        if (userNavigated.current) return;
        const firstCovered = (res.data.sessions || []).find((s) => (s.weekNumber ?? 0) > 0);
        if (!firstCovered) return;

        const [y, m] = firstCovered.date.split('-').map(Number);
        if (y !== now.getFullYear() || m - 1 !== now.getMonth()) {
          setViewedYear(y);
          setViewedMonth(m - 1);
        }
      })
      .catch(() => { /* ignore — keep the default (today's) month */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // Compute date range for the viewed month
  const { startDate, endDate } = useMemo(
    () => getMonthDateRange(viewedYear, viewedMonth),
    [viewedYear, viewedMonth]
  );

  // Fetch calendar entries via hook — pass studentId (not batchId) when known, so the backend
  // resolves drills from this student's own curriculum plan rather than the legacy batch one.
  const { entries, loading } = useSessionCalendar(
    studentId ? { startDate, endDate, studentId } : { startDate, endDate, batchId }
  );

  // Computed values
  const gridDays = useMemo(
    () => buildGridDays(viewedYear, viewedMonth),
    [viewedYear, viewedMonth]
  );

  const entriesByDate = useMemo(() => buildEntriesMap(entries), [entries]);

  const today = useMemo(() => getToday(), []);

  // Month navigation handlers
  const handlePrev = useCallback(() => {
    userNavigated.current = true;
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
    userNavigated.current = true;
    setViewedMonth((prev) => {
      if (prev === 11) {
        setViewedYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
    setSelectedDate(null);
  }, []);

  // Day click handler — toggles selection ring on the day
  const handleDayClick = useCallback(
    (date: string) => {
      const dayEntries = entriesByDate.get(date);
      if (dayEntries && dayEntries.length > 0) {
        setSelectedDate((prev) => prev === date ? null : date);
      } else {
        setSelectedDate(null);
      }
    },
    [entriesByDate]
  );

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

  const selectedEntries = selectedDate ? entriesByDate.get(selectedDate) ?? [] : [];

  return (
    <div className="student-schedule-calendar">
      <MonthNavigator
        year={viewedYear}
        month={viewedMonth}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <div className="student-schedule-calendar__body">
        <div className="student-schedule-calendar__grid-col">
          <CalendarGrid
            days={gridDays}
            entriesByDate={entriesByDate}
            selectedDate={selectedDate}
            today={today}
            onDayClick={handleDayClick}
            skillLevel={skillLevel}
          />

          {!hasSessionsThisMonth && (
            <p className="student-schedule-calendar__no-sessions">
              No sessions scheduled this month
            </p>
          )}
        </div>

      </div>

      {selectedDate && selectedEntries.length > 0 && (
        <DetailPanel
          entries={selectedEntries}
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

/**
 * SessionCalendarPage
 * Calendar view of training sessions with drill/focus area details.
 * Coach view: multi-batch color-coded calendar with batch color legend.
 * Student view: the same white-card monthly calendar used on a coach's view of
 * a student's profile (StudentScheduleCalendar) — highlighted only on days
 * actually covered by the student's own enrollment/curriculum.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 14.4, 14.5, 15.4, 15.5, 15.6
 */

import React, { useState, useMemo, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CalendarGrid from '../components/StudentScheduleCalendar/CalendarGrid';
import MonthNavigator from '../components/StudentScheduleCalendar/MonthNavigator';
import { StudentScheduleCalendar } from '../components/StudentScheduleCalendar';
import { BatchColorLegend } from '../components/BatchColorLegend';
import { CoachDayDetailPanel } from '../components/CoachDayDetailPanel';
import type { CoachBatchEntry } from '../components/CoachDayDetailPanel';
import { buildGridDays, buildEntriesMap, getToday } from '../components/StudentScheduleCalendar/calendarUtils';
import { assignBatchColors } from '../utils/batchColors';
import { useAuth } from '../contexts/AuthContext';
import { useStudent } from '../hooks/useStudent';
import { useSessionCalendar } from '../hooks/useSessionSchedule';
import type { CalendarEntry } from '../types';

/**
 * Compute start and end date for a 3-month window centered on the current date.
 */
function getDefaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  return {
    startDate: formatDateISO(start),
    endDate: formatDateISO(end),
  };
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const SessionCalendarPage: React.FC = () => {
  const { user, role } = useAuth();

  const isCoach = role === 'HEAD_COACH' || role === 'ASSISTANT_COACH';

  // Student's own record — only fetched for the student view, to pass batchId/skillLevel
  // into the shared StudentScheduleCalendar component.
  const { student, loading: studentLoading, error: studentError } = useStudent(!isCoach ? user?.id : undefined);

  // Date range for calendar query (3-month window) — coach only; the student view's
  // calendar fetches its own data internally via StudentScheduleCalendar.
  const { startDate, endDate } = useMemo(() => getDefaultDateRange(), []);
  const { entries, loading, error } = useSessionCalendar(isCoach ? { startDate, endDate } : undefined);

  // Month navigation state (coach view)
  const now = new Date();
  const [viewedYear, setViewedYear] = useState(now.getFullYear());
  const [viewedMonth, setViewedMonth] = useState(now.getMonth());

  const handlePrevMonth = useCallback(() => {
    setViewedMonth((prev) => {
      if (prev === 0) {
        setViewedYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewedMonth((prev) => {
      if (prev === 11) {
        setViewedYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  // Build grid days for the current viewed month
  const gridDays = useMemo(() => buildGridDays(viewedYear, viewedMonth), [viewedYear, viewedMonth]);

  // Build entries map for CalendarGrid
  const entriesByDate = useMemo(() => buildEntriesMap(entries), [entries]);

  // Assign batch colors (Req 2.2)
  const uniqueBatchIds = useMemo(
    () => [...new Set(entries.map((e) => e.batchId))],
    [entries]
  );
  const batchColorMap = useMemo(() => assignBatchColors(uniqueBatchIds), [uniqueBatchIds]);

  // Build batchColorsByDate map for CalendarGrid (Req 2.3)
  const batchColorsByDate = useMemo(() => {
    const map = new Map<string, Array<{ batchId: string; batchName: string; color: string }>>();
    entries.forEach((entry) => {
      const existing = map.get(entry.date) || [];
      if (!existing.some((b) => b.batchId === entry.batchId)) {
        existing.push({
          batchId: entry.batchId,
          batchName: entry.batchName,
          color: batchColorMap.get(entry.batchId) || '#888',
        });
      }
      map.set(entry.date, existing);
    });
    return map;
  }, [entries, batchColorMap]);

  // Build legend data (Req 2.4) — all unique batches with their colors
  const legendBatches = useMemo(() => {
    return uniqueBatchIds.map((id) => {
      const entry = entries.find((e) => e.batchId === id);
      return {
        batchId: id,
        batchName: entry?.batchName || id,
        color: batchColorMap.get(id) || '#888',
      };
    });
  }, [uniqueBatchIds, entries, batchColorMap]);

  // Coach day detail panel state (Req 3.1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [coachDayEntries, setCoachDayEntries] = useState<CoachBatchEntry[] | null>(null);

  const today = getToday();

  const handleDayClick = useCallback(
    (date: string) => {
      setSelectedDate(date);
      const dayEntries = entries.filter((e) => e.date === date);

      // Coach view: group entries by batchId and build CoachBatchEntry array (Req 3.1)
      const batchMap = new Map<string, CalendarEntry>();
      dayEntries.forEach((entry) => {
        if (!batchMap.has(entry.batchId)) {
          batchMap.set(entry.batchId, entry);
        }
      });

      const batchEntries: CoachBatchEntry[] = Array.from(batchMap.values()).map((entry) => ({
        batchId: entry.batchId,
        batchName: entry.batchName,
        batchColor: batchColorMap.get(entry.batchId) || '#888',
        startTime: entry.startTime,
        endTime: entry.endTime,
        focusArea: entry.focusArea || '',
      }));

      setCoachDayEntries(batchEntries);
    },
    [entries, batchColorMap]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedDate(null);
    setCoachDayEntries(null);
  }, []);

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Session Calendar</h1>
              <p className="page-header-subtitle">
                {isCoach
                  ? 'View all batch sessions and quickly access attendance marking'
                  : 'View your training sessions with planned drills and focus areas'}
              </p>
            </div>
          </div>

          {!isCoach ? (
            /* Student view — same white-card calendar used on a coach's view of this
               student's profile, so highlighting and layout stay identical everywhere. */
            <div className="card">
              <h2 className="text-h3" style={{ marginBottom: 'var(--space-lg)', marginTop: 0 }}>
                Schedule
              </h2>
              {studentLoading ? (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading your schedule...</p>
              ) : student ? (
                <StudentScheduleCalendar
                  batchId={student.batchId || ''}
                  skillLevel={student.skillLevel}
                  studentId={user!.id}
                />
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {studentError || 'Unable to load your schedule.'}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Error State */}
              {error && (
                <div
                  className="rounded-md p-4 text-sm"
                  style={{
                    backgroundColor: 'var(--feedback-danger-light)',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger)',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Loading State */}
              {loading && !entries.length && (
                <div
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2xl)',
                  }}
                >
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="h-24 bg-gray-100 rounded" />
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="h-24 bg-gray-100 rounded" />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content: Calendar Grid + Detail Panel */}
              {(!loading || entries.length > 0) && (
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Calendar with Month Navigator and Grid */}
                  <div className={coachDayEntries ? 'flex-1 min-w-0' : 'w-full'}>
                    {/* Batch Color Legend (Req 2.4) */}
                    {legendBatches.length > 0 && (
                      <BatchColorLegend batches={legendBatches} />
                    )}

                    {/* Month Navigator */}
                    <MonthNavigator
                      year={viewedYear}
                      month={viewedMonth}
                      onPrev={handlePrevMonth}
                      onNext={handleNextMonth}
                    />

                    {/* Calendar Grid with batch color dots */}
                    <CalendarGrid
                      days={gridDays}
                      entriesByDate={entriesByDate}
                      selectedDate={selectedDate}
                      today={today}
                      onDayClick={handleDayClick}
                      batchColorsByDate={batchColorsByDate}
                    />
                  </div>

                  {/* Coach Day Detail Panel (Req 3.1, 3.2, 3.3, 4.1) */}
                  {coachDayEntries && selectedDate && (
                    <aside className="w-full lg:w-96 shrink-0" aria-label="Day details">
                      <CoachDayDetailPanel
                        date={selectedDate}
                        batchEntries={coachDayEntries}
                        onClose={handleCloseDetail}
                      />
                    </aside>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && entries.length === 0 && (
                <div
                  className="text-center"
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2xl)',
                  }}
                >
                  <svg
                    className="mx-auto h-12 w-12"
                    style={{ color: 'var(--text-tertiary)' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    No sessions scheduled. Create a session schedule for your batches to see calendar entries.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SessionCalendarPage;

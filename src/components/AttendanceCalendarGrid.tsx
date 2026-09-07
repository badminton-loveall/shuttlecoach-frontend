/**
 * AttendanceCalendarGrid
 *
 * GitHub/trading-journal style calendar heatmap: renders a run of months
 * (default 6) as small month grids, each day cell colored by that day's
 * attendance status. Days with no attendance record (no session held, or a
 * date outside the range) render as a neutral "no session" cell; days
 * outside the month (calendar padding) render blank.
 */

import React, { useMemo, useState } from 'react';
import type { AttendanceRecord, AttendanceStatus } from '../types';
import './AttendanceCalendarGrid.css';

export interface AttendanceCalendarGridProps {
  records: AttendanceRecord[];
  /** How many months to show at once. Defaults to 6. */
  monthsToShow?: number;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Present',
  LATE: 'Late',
  ABSENT: 'Absent',
};

interface DayCell {
  date: Date;
  inMonth: boolean;
  status: AttendanceStatus | null;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildMonthGrid(
  year: number,
  month: number,
  statusByDate: Map<string, AttendanceStatus>
): DayCell[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const cells: DayCell[] = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ date: new Date(year, month, i - startWeekday + 1), inMonth: false, status: null });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    cells.push({ date, inMonth: true, status: statusByDate.get(toDateKey(date)) ?? null });
  }

  while (cells.length % 7 !== 0) {
    const prev = cells[cells.length - 1].date;
    const date = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1);
    cells.push({ date, inMonth: false, status: null });
  }

  return cells;
}

export const AttendanceCalendarGrid: React.FC<AttendanceCalendarGridProps> = ({
  records,
  monthsToShow = 6,
}) => {
  // 0 = the most recent `monthsToShow` months (ending this month). Larger
  // values page further into the past.
  const [windowOffset, setWindowOffset] = useState(0);

  const statusByDate = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    for (const record of records) {
      map.set(toDateKey(new Date(record.sessionDate)), record.status);
    }
    return map;
  }, [records]);

  const months = useMemo(() => {
    const today = new Date();
    const list: { year: number; month: number }[] = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - windowOffset - i, 1);
      list.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return list;
  }, [monthsToShow, windowOffset]);

  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];

  return (
    <div className="attendance-calendar">
      <div className="attendance-calendar__header">
        <button
          type="button"
          className="attendance-calendar__nav"
          onClick={() => setWindowOffset((o) => o + monthsToShow)}
          aria-label={`Show the previous ${monthsToShow} months`}
          title={`Show the previous ${monthsToShow} months`}
        >
          &larr;
        </button>
        <span className="attendance-calendar__range-label">
          {firstMonth.year === lastMonth.year
            ? `${MONTH_NAMES[firstMonth.month]} – ${MONTH_NAMES[lastMonth.month]} ${lastMonth.year}`
            : `${MONTH_NAMES[firstMonth.month]} ${firstMonth.year} – ${MONTH_NAMES[lastMonth.month]} ${lastMonth.year}`}
        </span>
        <button
          type="button"
          className="attendance-calendar__nav"
          onClick={() => setWindowOffset((o) => Math.max(0, o - monthsToShow))}
          disabled={windowOffset === 0}
          aria-label={`Show the next ${monthsToShow} months`}
          title={`Show the next ${monthsToShow} months`}
        >
          &rarr;
        </button>
      </div>

      <div className="attendance-calendar__months">
        {months.map(({ year, month }) => {
          const cells = buildMonthGrid(year, month, statusByDate);
          return (
            <div className="attendance-calendar__month" key={`${year}-${month}`}>
              <h4 className="attendance-calendar__month-title">{MONTH_NAMES[month]}</h4>
              <div className="attendance-calendar__weekdays" aria-hidden="true">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} className="attendance-calendar__weekday">{label}</span>
                ))}
              </div>
              <div className="attendance-calendar__grid" role="img" aria-label={`Attendance for ${MONTH_NAMES[month]} ${year}`}>
                {cells.map((cell, idx) => {
                  const label = cell.inMonth
                    ? `${cell.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${cell.status ? ` — ${STATUS_LABELS[cell.status]}` : ' — No session'}`
                    : undefined;
                  return (
                    <span
                      key={idx}
                      className={[
                        'attendance-calendar__cell',
                        !cell.inMonth && 'attendance-calendar__cell--pad',
                        cell.inMonth && cell.status && `attendance-calendar__cell--${cell.status.toLowerCase()}`,
                      ].filter(Boolean).join(' ')}
                      title={label}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="attendance-calendar__legend">
        <span className="attendance-calendar__legend-item">
          <span className="attendance-calendar__swatch attendance-calendar__cell--present" /> Present
        </span>
        <span className="attendance-calendar__legend-item">
          <span className="attendance-calendar__swatch attendance-calendar__cell--late" /> Late
        </span>
        <span className="attendance-calendar__legend-item">
          <span className="attendance-calendar__swatch attendance-calendar__cell--absent" /> Absent
        </span>
        <span className="attendance-calendar__legend-item">
          <span className="attendance-calendar__swatch" /> No session
        </span>
      </div>
    </div>
  );
};

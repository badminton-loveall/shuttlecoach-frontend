/**
 * DrillCompletionChart Component
 * Bar chart showing per-week drill completion rates and individual drill completion status.
 * Uses a pure CSS/HTML bar chart implementation with Tailwind for styling.
 *
 * Requirements: 6.3, 6.4
 */

import React, { useState } from 'react';
import type { DrillCompletionStats } from '../types';

export interface DrillCompletionChartProps {
  /** Array of per-week drill completion statistics */
  data: DrillCompletionStats[];
  /** Whether the data is currently loading */
  loading?: boolean;
  /** Error message if data fetch failed */
  error?: string | null;
}

/**
 * Returns a color class based on completion rate percentage.
 */
function getBarColor(rate: number): string {
  if (rate >= 80) return 'bg-green-500green-400';
  if (rate >= 50) return 'bg-yellow-500yellow-400';
  return 'bg-red-500red-400';
}

/**
 * Returns a text color class based on completion rate percentage.
 */
function getRateTextColor(rate: number): string {
  if (rate >= 80) return 'text-green-700';
  if (rate >= 50) return 'text-yellow-700';
  return 'text-red-700';
}

export const DrillCompletionChart: React.FC<DrillCompletionChartProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  // Loading state
  if (loading) {
    return (
      <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading drill completion data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-sm text-gray-500">
            No drill completion data available for this cycle.
          </p>
        </div>
      </div>
    );
  }

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeek(expandedWeek === weekNumber ? null : weekNumber);
  };

  return (
    <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Drill Completion by Week
      </h3>

      {/* Bar Chart */}
      <div className="space-y-4">
        {data.map((weekStats) => (
          <div key={weekStats.weekNumber}>
            {/* Week header row */}
            <button
              type="button"
              onClick={() => toggleWeek(weekStats.weekNumber)}
              className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md"
              aria-expanded={expandedWeek === weekStats.weekNumber}
              aria-controls={`week-${weekStats.weekNumber}-drills`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Week {weekStats.weekNumber}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-[160px]">
                    {weekStats.focusArea}
                  </span>
                  {/* Expand/collapse indicator */}
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                      expandedWeek === weekStats.weekNumber ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <span className={`text-sm font-semibold ${getRateTextColor(weekStats.completionRate)}`}>
                  {Math.round(weekStats.completionRate)}%
                </span>
              </div>
            </button>

            {/* Bar */}
            <div
              className="w-full h-6 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--border-default)' }}
              role="progressbar"
              aria-valuenow={Math.round(weekStats.completionRate)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Week ${weekStats.weekNumber} drill completion: ${Math.round(weekStats.completionRate)}%`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor(weekStats.completionRate)}`}
                style={{ width: `${Math.min(weekStats.completionRate, 100)}%` }}
              />
            </div>

            {/* Drill count label */}
            <p className="text-xs text-gray-500 mt-1">
              {weekStats.completedDrills}/{weekStats.totalDrills} drills completed
            </p>

            {/* Expanded drill list */}
            {expandedWeek === weekStats.weekNumber && (
              <div
                id={`week-${weekStats.weekNumber}-drills`}
                className="mt-3 ml-2 pl-3 space-y-2"
                style={{ borderLeft: '2px solid var(--border-default)' }}
              >
                {weekStats.drills.map((drill, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2"
                  >
                    {/* Completion indicator */}
                    {drill.completed ? (
                      <svg
                        className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm ${
                            drill.completed
                              ? 'text-gray-800'
                              : 'text-gray-500'
                          }`}
                        >
                          {drill.name}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {drill.category}
                        </span>
                      </div>
                      {drill.notes && (
                        <p className="text-xs text-gray-500 mt-0.5 italic">
                          {drill.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DrillCompletionChart;

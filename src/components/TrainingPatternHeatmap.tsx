/**
 * TrainingPatternHeatmap Component
 * Displays a heatmap showing attendance by day of week and curriculum week,
 * and a category distribution chart showing proportion of training time per skill category.
 *
 * Requirements: 10.1, 10.3
 */

import React from 'react';
import type { TrainingPatternReport } from '../hooks/useAnalytics';

export interface TrainingPatternHeatmapProps {
  /** Training pattern report with heatmap and category distribution data */
  data: TrainingPatternReport | null;
  /** Whether the data is currently loading */
  loading?: boolean;
  /** Error message if data fetch failed */
  error?: string | null;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Returns a Tailwind background color class based on attendance rate.
 */
function getHeatmapColor(rate: number): string {
  if (rate >= 90) return 'bg-green-500green-400';
  if (rate >= 75) return 'bg-green-300green-600';
  if (rate >= 60) return 'bg-yellow-300yellow-600';
  if (rate >= 40) return 'bg-orange-300orange-600';
  if (rate > 0) return 'bg-red-300red-600';
  return 'bg-gray-200';
}

/**
 * Returns a color for category distribution bar based on index.
 */
const CATEGORY_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
];

export const TrainingPatternHeatmap: React.FC<TrainingPatternHeatmapProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading training patterns...</p>
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
  if (!data || (data.attendanceHeatmap.length === 0 && data.categoryDistributions.length === 0)) {
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
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <p className="text-sm text-gray-500">
            No training pattern data available for the selected period.
          </p>
        </div>
      </div>
    );
  }

  // Determine unique week numbers from heatmap data
  const weekNumbers = [...new Set(data.attendanceHeatmap.map((h) => h.weekNumber))].sort(
    (a, b) => a - b
  );

  // Build a lookup map for quick access: key = `${dayOfWeek}-${weekNumber}`
  const heatmapMap = new Map<string, number>();
  data.attendanceHeatmap.forEach((entry) => {
    heatmapMap.set(`${entry.dayOfWeek}-${entry.weekNumber}`, entry.attendanceRate);
  });

  return (
    <div className="space-y-6">
      {/* Attendance Heatmap */}
      {data.attendanceHeatmap.length > 0 && (
        <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Attendance Heatmap
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Attendance rate by day of week and curriculum week
          </p>

          <div className="overflow-x-auto">
            <table className="text-xs" role="grid" aria-label="Attendance heatmap by day and week">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left text-gray-600 font-medium">
                    Day
                  </th>
                  {weekNumbers.map((week) => (
                    <th
                      key={week}
                      className="px-2 py-1 text-center text-gray-600 font-medium"
                    >
                      W{week}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAY_LABELS.map((dayLabel, dayIndex) => (
                  <tr key={dayIndex}>
                    <td className="px-2 py-1 text-gray-700 font-medium">
                      {dayLabel}
                    </td>
                    {weekNumbers.map((week) => {
                      const rate = heatmapMap.get(`${dayIndex}-${week}`) ?? 0;
                      return (
                        <td key={`${dayIndex}-${week}`} className="px-1 py-1">
                          <div
                            className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-medium text-white ${getHeatmapColor(rate)}`}
                            title={`${dayLabel}, Week ${week}: ${rate.toFixed(0)}%`}
                            aria-label={`${dayLabel}, Week ${week}: ${rate.toFixed(0)}% attendance`}
                          >
                            {rate > 0 ? `${Math.round(rate)}` : ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>Low</span>
            <div className="flex gap-0.5">
              <div className="w-4 h-4 rounded bg-red-300red-600" />
              <div className="w-4 h-4 rounded bg-orange-300orange-600" />
              <div className="w-4 h-4 rounded bg-yellow-300yellow-600" />
              <div className="w-4 h-4 rounded bg-green-300green-600" />
              <div className="w-4 h-4 rounded bg-green-500green-400" />
            </div>
            <span>High</span>
          </div>
        </div>
      )}

      {/* Category Distribution */}
      {data.categoryDistributions.length > 0 && (
        <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Training Category Distribution
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Proportion of training time by skill category
          </p>

          <div className="space-y-3">
            {data.categoryDistributions.map((cat, idx) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{cat.category}</span>
                  <span className="text-xs text-gray-500">
                    {cat.proportion.toFixed(1)}% ({cat.drillCount} drills)
                  </span>
                </div>
                <div className="w-full h-4 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-default)' }}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}`}
                    style={{ width: `${Math.min(cat.proportion, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(cat.proportion)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${cat.category}: ${cat.proportion.toFixed(1)}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPatternHeatmap;

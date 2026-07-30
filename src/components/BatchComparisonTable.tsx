/**
 * BatchComparisonTable Component
 * Sortable comparison table displaying batch-level or student-level metrics:
 * average skill improvement, attendance percentage, and drill completion rate.
 * Highlights rows where metrics fall below the batch/group average.
 *
 * Requirements: 8.2, 8.4
 */

import React, { useState, useMemo } from 'react';
import type { BatchComparisonMetric } from '../types';

export type SortColumn = 'batchName' | 'avgSkillImprovement' | 'avgAttendancePercentage' | 'avgDrillCompletionRate';
export type SortDirection = 'asc' | 'desc';

export interface BatchComparisonTableProps {
  /** Array of batch or student comparison metrics to display */
  data: BatchComparisonMetric[];
  /** Whether the data is currently loading */
  loading?: boolean;
  /** Error message if data fetch failed */
  error?: string | null;
  /** Optional title for the table header */
  title?: string;
  /** Label for the name column (e.g., "Batch" or "Student") */
  nameColumnLabel?: string;
}

/**
 * Compute the arithmetic mean of a numeric array.
 */
function computeAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Returns whether a given value is below the provided average threshold.
 */
function isBelowAverage(value: number, average: number): boolean {
  return value < average;
}

export const BatchComparisonTable: React.FC<BatchComparisonTableProps> = ({
  data,
  loading = false,
  error = null,
  title = 'Batch Comparison',
  nameColumnLabel = 'Batch',
}) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('avgSkillImprovement');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Compute averages for highlighting below-average rows
  const averages = useMemo(() => {
    if (!data || data.length === 0) {
      return { avgSkillImprovement: 0, avgAttendancePercentage: 0, avgDrillCompletionRate: 0 };
    }
    return {
      avgSkillImprovement: computeAverage(data.map((d) => d.avgSkillImprovement)),
      avgAttendancePercentage: computeAverage(data.map((d) => d.avgAttendancePercentage)),
      avgDrillCompletionRate: computeAverage(data.map((d) => d.avgDrillCompletionRate)),
    };
  }, [data]);

  // Sort data based on current sort state
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const numA = aVal as number;
      const numB = bVal as number;
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
    return sorted;
  }, [data, sortColumn, sortDirection]);

  // Handle column header click for sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Render sort indicator arrow
  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-3 h-3 text-gray-400 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'desc' ? (
      <svg className="w-3 h-3 text-blue-500 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-blue-500 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="rounded-lg" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading comparison data...</p>
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
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">
            No comparison data available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <h3 className="text-base font-semibold text-gray-900">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Rows highlighted in amber indicate below-average performance. Click column headers to sort.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left" role="grid" aria-label={title}>
          <thead className="text-xs uppercase bg-gray-50 text-gray-600" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <tr>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSort('batchName')}
                  className="flex items-center font-semibold uppercase hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  aria-sort={sortColumn === 'batchName' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {nameColumnLabel}
                  {renderSortIndicator('batchName')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('avgSkillImprovement')}
                  className="flex items-center justify-end w-full font-semibold uppercase hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  aria-sort={sortColumn === 'avgSkillImprovement' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  Avg Improvement
                  {renderSortIndicator('avgSkillImprovement')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('avgAttendancePercentage')}
                  className="flex items-center justify-end w-full font-semibold uppercase hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  aria-sort={sortColumn === 'avgAttendancePercentage' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  Attendance %
                  {renderSortIndicator('avgAttendancePercentage')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('avgDrillCompletionRate')}
                  className="flex items-center justify-end w-full font-semibold uppercase hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  aria-sort={sortColumn === 'avgDrillCompletionRate' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  Drill Completion %
                  {renderSortIndicator('avgDrillCompletionRate')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ '--tw-divide-color': 'var(--border-default)' } as React.CSSProperties}>
            {sortedData.map((row) => {
              const belowImprovement = isBelowAverage(row.avgSkillImprovement, averages.avgSkillImprovement);
              const belowAttendance = isBelowAverage(row.avgAttendancePercentage, averages.avgAttendancePercentage);
              const belowCompletion = isBelowAverage(row.avgDrillCompletionRate, averages.avgDrillCompletionRate);
              const isHighlighted = belowImprovement || belowAttendance || belowCompletion;

              return (
                <tr
                  key={row.batchId}
                  className={
                    isHighlighted
                      ? 'bg-amber-50amber-900/20 hover:bg-amber-100'
                      : 'hover:bg-gray-50'
                  }
                >
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {isHighlighted && (
                        <svg
                          className="w-4 h-4 text-amber-500 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-label="Below average in one or more metrics"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {row.batchName}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums ${belowImprovement ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                    {row.avgSkillImprovement >= 0 ? '+' : ''}{row.avgSkillImprovement.toFixed(1)}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums ${belowAttendance ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                    {row.avgAttendancePercentage.toFixed(1)}%
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums ${belowCompletion ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                    {row.avgDrillCompletionRate.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with averages summary */}
      <div className="px-5 py-3 bg-gray-50" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <span>
            Avg Improvement: <strong className="text-gray-800">{averages.avgSkillImprovement >= 0 ? '+' : ''}{averages.avgSkillImprovement.toFixed(1)}</strong>
          </span>
          <span>
            Avg Attendance: <strong className="text-gray-800">{averages.avgAttendancePercentage.toFixed(1)}%</strong>
          </span>
          <span>
            Avg Drill Completion: <strong className="text-gray-800">{averages.avgDrillCompletionRate.toFixed(1)}%</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default BatchComparisonTable;

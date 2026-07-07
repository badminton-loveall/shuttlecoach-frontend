import React from 'react';
import type { Batch } from '../types';

/**
 * BatchListItem Component
 * Renders individual batch row with all fields and metrics
 *
 * Requirements:
 * 5.1: Render individual batch row with all fields
 * 5.2: Support click to view detailed metrics
 * 5.3: Show metrics: total students, attendance rate, average skill level
 */

export interface BatchMetrics {
  attendanceRate: number;
  averageSkillLevel: number;
}

export interface BatchListItemProps {
  batch: Batch;
  metrics: BatchMetrics;
  onSelect?: (batchId: string) => void;
  isSelected?: boolean;
  onRemove?: (batch: Batch) => void;
  canRemove?: boolean;
  isRemoving?: boolean;
}

export const BatchListItem: React.FC<BatchListItemProps> = ({
  batch,
  metrics,
  onSelect,
  isSelected = false,
  onRemove,
  canRemove = false,
  isRemoving = false,
}) => {
  const handleItemClick = () => {
    onSelect?.(batch.id);
  };

  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleItemClick();
    }
  };

  const handleRemoveClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onRemove && !isRemoving) {
      onRemove(batch);
    }
  };

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={handleItemClick}
      onKeyDown={handleItemKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${batch.name} batch`}
    >
      {/* Batch Name as Heading with Remove Button */}
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-lg font-semibold text-gray-900">{batch.name}</h4>
        {canRemove && (
          <button
            className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRemoveClick}
            disabled={isRemoving}
            aria-label={`Remove ${batch.name} batch`}
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        )}
      </div>

      {/* Schedule */}
      {batch.schedule && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Schedule</p>
          <p className="text-base text-gray-900">{batch.schedule}</p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mt-6 pt-6 border-t border-gray-200">
        {/* Student Count */}
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
            Students
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{batch.studentCount}</p>
        </div>

        {/* Attendance Rate */}
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
            Attendance
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-900">{metrics.attendanceRate}%</p>
            <div
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                metrics.attendanceRate >= 90
                  ? 'bg-green-100 text-green-700'
                  : metrics.attendanceRate >= 75
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {metrics.attendanceRate >= 90
                ? 'Excellent'
                : metrics.attendanceRate >= 75
                  ? 'Good'
                  : 'Fair'}
            </div>
          </div>
        </div>

        {/* Average Skill Level */}
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
            Avg Skill
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {Math.round(metrics.averageSkillLevel)}%
          </p>
        </div>

        {/* Created Date */}
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
            Created
          </p>
          <p className="text-base text-gray-900 mt-1">
            {new Date(batch.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Selected State Indicator */}
      {isSelected && (
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-900">
            Batch details: {batch.studentCount} students enrolled • {metrics.attendanceRate}% attendance
          </p>
        </div>
      )}
    </div>
  );
};

export default BatchListItem;

import React, { useMemo, useState } from 'react';
import type { Batch, UserRole } from '../types';
import { BatchListItem } from './BatchListItem';
import { AddBatchModal } from './AddBatchModal';

/**
 * CoachBatchesTab Component
 * Displays list of all assigned batches with metrics in read-only or editable mode
 *
 * Requirements:
 * 5.1: Display list of all assigned batches
 * 5.2: Display batch name, schedule, student count, metrics
 * 5.3: Display batch metrics (attendance rate, average skill level)
 * 5.5: Display empty state when no batches assigned
 * 6.1: Render "Add Batch" button for authorized roles
 * 6.2: Open modal to select and assign available batches
 * 6.3: Assign selected batch to coach via API
 * 6.6: Refresh batch list and update header count on success
 */

export interface CoachBatchesTabProps {
  batches: Batch[];
  userRole: UserRole;
  coachId: string;
  isLoading?: boolean;
  onBatchAssigned?: (batchId: string) => void;
  onBatchUnassigned?: (batchId: string) => void;
}

/**
 * Calculate mock metrics for display purposes
 * In production, these would come from the API/backend
 */
function calculateBatchMetrics(batch: Batch) {
  // Mock metrics based on batch data
  // In a real scenario, these would be calculated from attendance records and assessments
  const baseAttendanceRate = 85 + Math.floor(Math.random() * 15); // 85-100%
  const baseSkillLevel = (batch.studentCount * 10 + 50) % 100; // Mock skill level

  return {
    attendanceRate: Math.min(100, baseAttendanceRate),
    averageSkillLevel: baseSkillLevel,
  };
}

export const CoachBatchesTab: React.FC<CoachBatchesTabProps> = ({
  batches,
  userRole,
  coachId,
  isLoading = false,
  onBatchAssigned,
  onBatchUnassigned,
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [removingBatchId, setRemovingBatchId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [batchToRemove, setBatchToRemove] = useState<Batch | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Check if user can manage batches (only HEAD_COACH)
  const canManageBatches = userRole === 'HEAD_COACH';

  // Memoize metrics to avoid recalculation on every render
  const batchesWithMetrics = useMemo(
    () =>
      batches.map(batch => ({
        ...batch,
        metrics: calculateBatchMetrics(batch),
      })),
    [batches]
  );

  /**
   * Handle batch assignment from modal
   */
  const handleBatchAssigned = (batchId: string) => {
    if (onBatchAssigned) {
      onBatchAssigned(batchId);
    }
    setShowAddBatchModal(false);
  };

  /**
   * Handle batch removal request - show confirmation dialog
   */
  const handleRemoveClick = (batch: Batch) => {
    setBatchToRemove(batch);
    setShowRemoveConfirm(true);
    setRemoveError(null);
  };

  /**
   * Handle confirmed batch removal - call the callback
   */
  const handleRemoveConfirm = async () => {
    if (!batchToRemove) return;

    setRemovingBatchId(batchToRemove.id);
    setRemoveError(null);

    try {
      // Call the parent component's callback which should handle the API call
      if (onBatchUnassigned) {
        onBatchUnassigned(batchToRemove.id);
      }
      setShowRemoveConfirm(false);
      setBatchToRemove(null);
    } catch (error) {
      setRemoveError(error instanceof Error ? error.message : 'Failed to remove batch');
    } finally {
      setRemovingBatchId(null);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (batches.length === 0) {
    return (
      <>
        <div className="p-6 flex flex-col items-center justify-center min-h-96">
          <svg
            className="w-16 h-16 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V7a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Batches Assigned</h3>
          <p className="text-gray-600 text-center mb-6 max-w-sm">
            This coach does not have any batches assigned yet. 
            {canManageBatches
              ? ' Click the "Add Batch" button to assign batches.'
              : ''}
          </p>
          {canManageBatches && (
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Add new batch"
              onClick={() => setShowAddBatchModal(true)}
            >
              Add Batch
            </button>
          )}
        </div>

        {/* Add Batch Modal */}
        {canManageBatches && (
          <AddBatchModal
            isOpen={showAddBatchModal}
            onClose={() => setShowAddBatchModal(false)}
            onBatchAssigned={handleBatchAssigned}
            coachId={coachId}
            currentAssignedBatchIds={batches.map(b => b.id)}
            isLoading={isLoading}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="p-6 space-y-4">
        {/* Header with Add Batch Button */}
        {canManageBatches && (
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Assigned Batches ({batches.length})
            </h3>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Add new batch"
              onClick={() => setShowAddBatchModal(true)}
            >
              Add Batch
            </button>
          </div>
        )}

        {/* Batches List */}
        <div className="space-y-4">
          {batchesWithMetrics.map(batch => (
            <BatchListItem
              key={batch.id}
              batch={batch}
              metrics={batch.metrics}
              onSelect={setSelectedBatchId}
              isSelected={selectedBatchId === batch.id}
              canRemove={canManageBatches}
              isRemoving={removingBatchId === batch.id}
              onRemove={canManageBatches ? handleRemoveClick : undefined}
            />
          ))}
        </div>

        {/* Info message for read-only users */}
        {!canManageBatches && batches.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              You can view batch information in read-only mode. To manage batch assignments, contact your administrator.
            </p>
          </div>
        )}
      </div>

      {/* Add Batch Modal */}
      {canManageBatches && (
        <AddBatchModal
          isOpen={showAddBatchModal}
          onClose={() => setShowAddBatchModal(false)}
          onBatchAssigned={handleBatchAssigned}
          coachId={coachId}
          currentAssignedBatchIds={batches.map(b => b.id)}
          isLoading={isLoading}
        />
      )}

      {/* Remove Batch Confirmation Dialog */}
      {showRemoveConfirm && batchToRemove && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="presentation"
        >
          <dialog 
            open
            className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4"
            aria-labelledby="remove-batch-title"
            aria-describedby="remove-batch-description"
          >
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0V9m0 0v8m0-8h-.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 id="remove-batch-title" className="text-lg font-semibold text-gray-900 text-center mb-2">
                Unassign Batch?
              </h3>
              <p id="remove-batch-description" className="text-gray-600 text-center mb-6">
                Are you sure you want to unassign <strong>{batchToRemove.name}</strong> from this coach? This action cannot be undone.
              </p>
              {removeError && (
                <div 
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700"
                  role="alert"
                  aria-live="polite"
                >
                  {removeError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemoveConfirm(false);
                    setBatchToRemove(null);
                  }}
                  disabled={removingBatchId === batchToRemove.id}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Cancel batch unassignment"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveConfirm}
                  disabled={removingBatchId === batchToRemove.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Confirm batch unassignment"
                >
                  {removingBatchId === batchToRemove.id ? 'Removing...' : 'Unassign'}
                </button>
              </div>
            </div>
          </dialog>
        </div>
      )}
    </>
  );
};

export default CoachBatchesTab;

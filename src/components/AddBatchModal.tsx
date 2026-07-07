import React, { useState, useEffect } from 'react';
import type { Batch } from '../types';
import apiClient from '../utils/apiClient';

/**
 * AddBatchModal Component
 * Modal for selecting and assigning available batches to a coach
 *
 * Requirements:
 * 6.1: Display "Add Batch" button for authorized roles
 * 6.2: Open modal to select and assign available batches
 * 6.3: Assign selected batch to coach via API
 * 6.6: Refresh batch list and update header count on success
 */

export interface AddBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchAssigned: (batchId: string) => void;
  coachId: string;
  currentAssignedBatchIds?: string[];
  isLoading?: boolean;
}

export const AddBatchModal: React.FC<AddBatchModalProps> = ({
  isOpen,
  onClose,
  onBatchAssigned,
  coachId,
  currentAssignedBatchIds = [],
  isLoading: parentIsLoading = false,
}) => {
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available batches when modal opens
  useEffect(() => {
    if (isOpen && !parentIsLoading) {
      fetchAvailableBatches();
    }
  }, [isOpen, parentIsLoading]);

  /**
   * Fetch all available batches from API
   */
  const fetchAvailableBatches = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<Batch[]>('/batches');

      // Filter out already assigned batches
      const unassignedBatches = response.data.filter(
        (batch) => !currentAssignedBatchIds.includes(batch.id)
      );

      setAvailableBatches(unassignedBatches);

      // Select first available batch by default
      if (unassignedBatches.length > 0) {
        setSelectedBatchId(unassignedBatches[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch available batches:', err);
      setError('Failed to load available batches. Please try again.');
      setAvailableBatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle batch assignment
   */
  const handleAssignBatch = async () => {
    if (!selectedBatchId) {
      setError('Please select a batch');
      return;
    }

    try {
      setIsAssigning(true);
      setError(null);

      // Assign batch to coach via API
      await apiClient.post(`/coaches/${coachId}/batches`, {
        batchId: selectedBatchId,
      });

      // Call callback to notify parent component
      onBatchAssigned(selectedBatchId);

      // Close modal
      onClose();

      // Reset state
      setSelectedBatchId(null);
    } catch (err) {
      console.error('Failed to assign batch:', err);
      if (err instanceof Error && 'response' in err) {
        const errorResponse = (err as any).response;
        if (errorResponse?.status === 409) {
          setError('This batch is already assigned to this coach');
        } else {
          setError('Failed to assign batch. Please try again.');
        }
      } else {
        setError('Failed to assign batch. Please try again.');
      }
    } finally {
      setIsAssigning(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    setSelectedBatchId(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content modal-content--small"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Assign Batch to Coach</h2>
            <p className="modal-subtitle">
              Select a batch to assign to this coach
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isAssigning || isLoading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-body">
          {/* Error Message */}
          {error && (
            <div className="form-error-banner">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          ) : availableBatches.length === 0 ? (
            /* No Available Batches */
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-3"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No Available Batches
              </h3>
              <p className="text-gray-600">
                All batches are already assigned or no batches exist
              </p>
            </div>
          ) : (
            /* Batch Selection */
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Available Batches
              </label>
              {availableBatches.map((batch) => (
                <label
                  key={batch.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedBatchId === batch.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="batch"
                    value={batch.id}
                    checked={selectedBatchId === batch.id}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    disabled={isAssigning}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {batch.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      Schedule: {batch.schedule} • {batch.studentCount} students
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {availableBatches.length > 0 && (
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isAssigning}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAssignBatch}
              disabled={!selectedBatchId || isAssigning || isLoading}
            >
              {isAssigning ? 'Assigning...' : 'Assign Batch'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddBatchModal;

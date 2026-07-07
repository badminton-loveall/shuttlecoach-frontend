import React, { useState, useEffect } from 'react';
import type { Student, Batch } from '../types';
import apiClient from '../utils/apiClient';

/**
 * AddStudentModal Component
 * Modal for selecting and assigning available students to a coach's batch
 *
 * Requirements:
 * 9.1: Render "Add Student" button for authorized roles
 * 9.2: Open modal to select available students and batch
 * 9.3: Assign selected student to coach's batch via API
 * 9.5: Refresh student list and update header count on success
 */

export interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAssigned: (studentId: string) => void;
  coachId: string;
  currentAssignedStudentIds?: string[];
  availableBatches?: Batch[];
  isLoading?: boolean;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onStudentAssigned,
  coachId,
  currentAssignedStudentIds = [],
  availableBatches = [],
  isLoading: parentIsLoading = false,
}) => {
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available students when modal opens
  useEffect(() => {
    if (isOpen && !parentIsLoading) {
      fetchAvailableStudents();
      // Set default batch selection
      if (availableBatches.length > 0) {
        setSelectedBatchId(availableBatches[0].id);
      }
    }
  }, [isOpen, parentIsLoading, availableBatches]);

  /**
   * Fetch all available students from API
   */
  const fetchAvailableStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<Student[]>('/students');

      // Filter out already assigned students to this coach
      const unassignedStudents = response.data.filter(
        (student) => !currentAssignedStudentIds.includes(student.id)
      );

      setAvailableStudents(unassignedStudents);

      // Select first available student by default
      if (unassignedStudents.length > 0) {
        setSelectedStudentId(unassignedStudents[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch available students:', err);
      setError('Failed to load available students. Please try again.');
      setAvailableStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle student assignment
   */
  const handleAssignStudent = async () => {
    if (!selectedStudentId) {
      setError('Please select a student');
      return;
    }

    if (!selectedBatchId) {
      setError('Please select a batch');
      return;
    }

    try {
      setIsAssigning(true);
      setError(null);

      // Assign student to coach's batch via API
      await apiClient.post(`/coaches/${coachId}/students`, {
        studentId: selectedStudentId,
        batchId: selectedBatchId,
      });

      // Call callback to notify parent component
      onStudentAssigned(selectedStudentId);

      // Close modal
      onClose();

      // Reset state
      setSelectedStudentId(null);
      setSelectedBatchId(null);
    } catch (err) {
      console.error('Failed to assign student:', err);
      if (err instanceof Error && 'response' in err) {
        const errorResponse = (err as any).response;
        if (errorResponse?.status === 409) {
          setError('This student is already assigned to this coach');
        } else {
          setError('Failed to assign student. Please try again.');
        }
      } else {
        setError('Failed to assign student. Please try again.');
      }
    } finally {
      setIsAssigning(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    setSelectedStudentId(null);
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
            <h2 className="modal-title">Assign Student to Coach</h2>
            <p className="modal-subtitle">
              Select a student and batch to assign to this coach
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
          ) : availableStudents.length === 0 ? (
            /* No Available Students */
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No Available Students
              </h3>
              <p className="text-gray-600">
                All students are already assigned or no students exist
              </p>
            </div>
          ) : (
            /* Student and Batch Selection */
            <div className="space-y-6">
              {/* Batch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Batch *
                </label>
                {availableBatches.length === 0 ? (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      No batches available for this coach
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedBatchId || ''}
                    onChange={(e) => setSelectedBatchId(e.target.value || null)}
                    disabled={isAssigning}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Select batch for student assignment"
                  >
                    <option value="">Choose a batch...</option>
                    {availableBatches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name} (Schedule: {batch.schedule})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Student *
                </label>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availableStudents.map((student) => (
                    <label
                      key={student.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedStudentId === student.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="student"
                        value={student.id}
                        checked={selectedStudentId === student.id}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        disabled={isAssigning}
                        className="w-4 h-4 text-blue-600"
                        aria-label={`Select student: ${student.fullName}`}
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {student.fullName}
                        </p>
                        <p className="text-xs text-gray-600">
                          Skill Level: {student.skillLevel} • Age: {student.age} yrs
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {availableStudents.length > 0 && availableBatches.length > 0 && (
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
              onClick={handleAssignStudent}
              disabled={!selectedStudentId || !selectedBatchId || isAssigning || isLoading}
            >
              {isAssigning ? 'Assigning...' : 'Assign Student'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddStudentModal;

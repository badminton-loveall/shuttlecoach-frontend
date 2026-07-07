import React, { useState, useMemo } from 'react';
import type { Student, UserRole, StudentFilters, SkillLevel, Batch } from '../types';
import { filterStudents, getUniqueBatchIds, getUniqueSkillLevels } from '../utils/filtering';
import { StudentListItem } from './StudentListItem';
import { StudentQuickViewModal } from './StudentQuickViewModal';
import { AddStudentModal } from './AddStudentModal';

/**
 * CoachStudentsTab Component
 * Displays all students assigned to a coach with filtering capabilities
 * 
 * Requirements:
 * 8.1: Display list of all students in coach's batches
 * 8.2: For each student show: name, batch, skill level, performance status
 * 8.3: Render filter UI for batch and skill level filters
 * 8.5: Support read-only mode for non-HEAD_COACH roles
 * 8.6: Display empty state when no students assigned
 * 9.1: Render "Add Student" button for authorized roles
 * 9.2: Open modal to select available students and batch
 * 9.3: Assign selected student to coach's batch via API
 * 9.5: Refresh student list and update header count on success
 * 9.4: Show remove option on each student row
 * 9.5: Confirm removal via confirmation dialog
 * 9.6: Remove via API DELETE endpoint and update list and header count on success
 */

interface CoachStudentsTabProps {
  students: Student[];
  coachId: string;
  userRole: UserRole;
  batches?: Batch[];
  onStudentAdded?: (studentId: string) => void;
  onStudentRemoved?: (studentId: string) => void;
  onStudentsRefresh?: () => void;
  isLoading?: boolean;
}

/**
 * Get performance status based on skill level and other metrics
 */
const getPerformanceStatus = (student: Student): string => {
  switch (student.skillLevel) {
    case 'Professional':
      return 'Excellent';
    case 'Advanced':
      return 'Very Good';
    case 'Intermediate':
      return 'Good';
    case 'Beginner':
      return 'Fair';
    default:
      return 'Not Assessed';
  }
};

export const CoachStudentsTab: React.FC<CoachStudentsTabProps> = ({
  students,
  coachId,
  userRole,
  batches = [],
  onStudentAdded,
  onStudentRemoved,
  onStudentsRefresh,
  isLoading = false,
}) => {
  // Filter state
  const [filters, setFilters] = useState<StudentFilters>({
    batch: undefined,
    skillLevel: undefined,
    search: undefined,
  });

  // Quick view modal state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Modal state for adding students
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Confirmation dialog state
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);
  const [isRemovingStudent, setIsRemovingStudent] = useState(false);

  // Get unique batch IDs and skill levels for filter dropdowns
  const uniqueBatches = useMemo(() => getUniqueBatchIds(students), [students]);
  const uniqueSkillLevels = useMemo(() => getUniqueSkillLevels(students), [students]);

  // Apply filters to students
  const filteredStudents = useMemo(
    () => filterStudents(students, filters),
    [students, filters]
  );

  // Check if user can edit (HEAD_COACH only)
  const canEdit = userRole === 'HEAD_COACH';

  /**
   * Handle add student button click - open modal
   */
  const handleAddStudentClick = () => {
    setShowAddStudentModal(true);
  };

  /**
   * Handle student assignment from modal
   */
  const handleStudentAssigned = (studentId: string) => {
    // Close modal
    setShowAddStudentModal(false);
    
    // Call the callback to notify parent and trigger data refresh
    onStudentAdded?.(studentId);
    
    // Trigger refresh if callback provided
    onStudentsRefresh?.();
  };

  /**
   * Handle removal button click - show confirmation dialog
   */
  const handleRemoveClick = (student: Student) => {
    setStudentToRemove(student);
  };

  /**
   * Confirm and perform student removal
   */
  const handleConfirmRemove = async () => {
    if (!studentToRemove) return;

    setIsRemovingStudent(true);
    try {
      // Call the onStudentRemoved callback to trigger API call
      await onStudentRemoved?.(studentToRemove.id);
      
      // Clear the confirmation dialog
      setStudentToRemove(null);
    } catch (err) {
      console.error('Failed to remove student:', err);
      // Keep the dialog open on error
    } finally {
      setIsRemovingStudent(false);
    }
  };

  /**
   * Cancel removal and close confirmation dialog
   */
  const handleCancelRemove = () => {
    setStudentToRemove(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <svg
          className="h-12 w-12 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
        <p className="text-gray-600 text-center">No students assigned to this coach</p>
        {canEdit && (
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleAddStudentClick}
            aria-label="Add student"
          >
            Add Student
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Filter UI */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Batch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
            <select
              value={filters.batch || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  batch: e.target.value || undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by batch"
            >
              <option value="">All Batches</option>
              {uniqueBatches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>

          {/* Skill Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
            <select
              value={filters.skillLevel || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  skillLevel: (e.target.value || undefined) as SkillLevel | undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by skill level"
            >
              <option value="">All Skill Levels</option>
              {uniqueSkillLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Search Text Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  search: e.target.value || undefined,
                })
              }
              placeholder="Name, BAID, or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search students by name, BAID, or email"
            />
          </div>
        </div>

        {/* Active Filters Info */}
        {(filters.batch || filters.skillLevel || filters.search) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.batch && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span>Batch: {filters.batch}</span>
                <button
                  onClick={() => setFilters({ ...filters, batch: undefined })}
                  className="text-blue-600 hover:text-blue-900 font-medium"
                  aria-label={`Clear batch filter: ${filters.batch}`}
                >
                  ✕
                </button>
              </div>
            )}
            {filters.skillLevel && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span>Skill: {filters.skillLevel}</span>
                <button
                  onClick={() => setFilters({ ...filters, skillLevel: undefined })}
                  className="text-blue-600 hover:text-blue-900 font-medium"
                  aria-label={`Clear skill level filter: ${filters.skillLevel}`}
                >
                  ✕
                </button>
              </div>
            )}
            {filters.search && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span>Search: {filters.search}</span>
                <button
                  onClick={() => setFilters({ ...filters, search: undefined })}
                  className="text-blue-600 hover:text-blue-900 font-medium"
                  aria-label={`Clear search filter: ${filters.search}`}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* No results after filtering */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No students match your filters</p>
          <button
            onClick={() => setFilters({ batch: undefined, skillLevel: undefined, search: undefined })}
            className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Student Count */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Students ({filteredStudents.length})
            </h3>
            {canEdit && (
              <button
                onClick={handleAddStudentClick}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                aria-label="Add student"
              >
                + Add Student
              </button>
            )}
          </div>

          {/* Students List */}
          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <StudentListItem
                key={student.id}
                student={student}
                performanceStatus={getPerformanceStatus(student)}
                onSelect={setSelectedStudent}
                onRemove={handleRemoveClick}
                canRemove={canEdit}
              />
            ))}
          </div>
        </>
      )}

      {/* Remove Student Confirmation Dialog */}
      {studentToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 space-y-4">
            {/* Icon */}
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mx-auto">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-gray-900 text-center">
              Remove Student?
            </h2>

            {/* Message */}
            <p className="text-gray-600 text-center text-sm">
              Are you sure you want to remove{' '}
              <strong>{studentToRemove.fullName}</strong> from this coach's students? This action cannot be undone.
            </p>

            {/* Student Details */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Batch:</span>
                <span className="font-medium text-gray-900">
                  {studentToRemove.batchId || '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Skill Level:</span>
                <span className="font-medium text-gray-900">
                  {studentToRemove.skillLevel}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancelRemove}
                disabled={isRemovingStudent}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isRemovingStudent}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {isRemovingStudent ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Quick View Modal */}
      <StudentQuickViewModal
        student={selectedStudent}
        isOpen={selectedStudent !== null}
        onClose={() => setSelectedStudent(null)}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onStudentAssigned={handleStudentAssigned}
        coachId={coachId}
        currentAssignedStudentIds={students.map((s) => s.id)}
        availableBatches={batches}
      />
    </div>
  );
};

export default CoachStudentsTab;

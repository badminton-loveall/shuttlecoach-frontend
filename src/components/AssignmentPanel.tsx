import React, { useState } from 'react';
import type { User, Student, Batch } from '../types';
import apiClient from '../utils/apiClient';
import './AssignmentPanel.css';

/**
 * AssignmentPanel Component - REDESIGNED
 * Manages coach assignments to batches and individual students
 * 
 * New UX Features:
 * - Assignment form in separate card at top
 * - Two-column grid layout for batches and students side-by-side
 * - Click batch to filter students by that batch
 * - Consistent action button styling (Edit/Delete links)
 * - Compact grid design following table patterns
 */

interface AssignmentPanelProps {
  selectedCoach: User | null;
  students: Student[];
  batches: Batch[];
  onAssignmentChange: (updatedStudents: Student[], updatedBatches: Batch[]) => void;
}

export const AssignmentPanel: React.FC<AssignmentPanelProps> = ({
  selectedCoach,
  students,
  batches,
  onAssignmentChange,
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedBatchFilterId, setSelectedBatchFilterId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  if (!selectedCoach) {
    return (
      <div className="assignment-panel-empty">
        <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="empty-text">Select a coach to manage assignments</p>
      </div>
    );
  }

  // Data preparation
  const isHeadCoach = selectedCoach.role === 'HEAD_COACH';

  // Head coach sees ALL batches and students in the center (readonly overview)
  // Assistant coaches only see their directly assigned ones
  const assignedStudents = isHeadCoach
    ? students
    : students.filter((student) => student.assignedCoachId === selectedCoach.id);

  // A batch counts as assigned to the coach either because it was explicitly assigned
  // (the manual "Assign to Batch" action below) or because one of the coach's
  // individually-assigned students belongs to it — matches the same derivation used
  // for the "Assigned Batches" count on the coaches list.
  const assignedBatches = isHeadCoach
    ? batches
    : batches.filter((batch) =>
        batch.assignedCoachId === selectedCoach.id ||
        assignedStudents.some((student) => student.batchId === batch.id)
      );
  const unassignedBatches = batches.filter((batch) => !batch.assignedCoachId);
  const unassignedStudents = students.filter((student) => !student.assignedCoachId);

  // Handlers — each persists via PATCH /coaches/:id/assign, then hands the (unchanged)
  // students/batches back to the parent purely to trigger its refetch from the server.
  const runAssignment = async (body: { studentIds?: string[]; batchId?: string; action: 'ASSIGN' | 'UNASSIGN' }) => {
    setIsSaving(true);
    setAssignError(null);
    try {
      await apiClient.patch(`/coaches/${selectedCoach.id}/assign`, body);
      onAssignmentChange(students, batches);
    } catch (err) {
      console.error('Failed to update coach assignment:', err);
      setAssignError('Failed to save assignment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignBatch = () => {
    if (!selectedBatchId) return;
    void runAssignment({ batchId: selectedBatchId, action: 'ASSIGN' });
    setSelectedBatchId('');
  };

  const handleAssignStudent = () => {
    if (!selectedStudentId) return;
    void runAssignment({ studentIds: [selectedStudentId], action: 'ASSIGN' });
    setSelectedStudentId('');
  };

  const handleUnassignBatch = (batchId: string) => {
    void runAssignment({ batchId, action: 'UNASSIGN' });
  };

  const handleUnassignStudent = (studentId: string) => {
    void runAssignment({ studentIds: [studentId], action: 'UNASSIGN' });
  };

  // Filter students based on selected batch
  const filteredStudents = selectedBatchFilterId
    ? assignedStudents.filter((s) => s.batchId === selectedBatchFilterId)
    : assignedStudents;

  // Get batch name from ID
  const getBatchName = (batchId: string) => {
    return batches.find((b) => b.id === batchId)?.name || batchId;
  };

  return (
    <div className="assignment-panel">
      {/* Header */}
      <div className="assignment-header">
        <div>
          <h2 className="assignment-title">
            {isHeadCoach ? `Overview for ${selectedCoach.name}` : `Assignments for ${selectedCoach.name}`}
          </h2>
          <p className="assignment-subtitle">
            {isHeadCoach
              ? 'All batches and students in your center'
              : 'Manage batch and student assignments for this coach'}
          </p>
        </div>
      </div>

      {assignError && (
        <div className="p-md" style={{ backgroundColor: 'var(--feedback-danger-light)', border: '1px solid var(--color-danger-light)', borderRadius: 'var(--radius-md)' }}>
          <p className="text-small" style={{ color: 'var(--color-danger-text)' }}>{assignError}</p>
        </div>
      )}

      {/* Assignment Form Card - Only for assistant coaches */}
      {!isHeadCoach && (
      <div className="assignment-form-section">
        <div className="assignment-form-card">
          <div className="form-card-header">
            <h3 className="form-card-title">Assign to Batch</h3>
            <span className="form-card-badge">{unassignedBatches.length} available</span>
          </div>
          <div className="form-card-body">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="form-select"
              disabled={unassignedBatches.length === 0}
            >
              <option value="">Select a batch...</option>
              {unassignedBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} ({batch.schedule})
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignBatch}
              disabled={!selectedBatchId || isSaving}
              className="btn-assign"
            >
              Assign
            </button>
          </div>
        </div>

        <div className="assignment-form-card">
          <div className="form-card-header">
            <h3 className="form-card-title">Assign Individual</h3>
            <span className="form-card-badge">{unassignedStudents.length} available</span>
          </div>
          <div className="form-card-body">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="form-select"
              disabled={unassignedStudents.length === 0}
            >
              <option value="">Select a student...</option>
              {unassignedStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName} • {student.skillLevel}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignStudent}
              disabled={!selectedStudentId || isSaving}
              className="btn-assign"
            >
              Assign
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Current Assignments - Two Column Grid */}
      <div className="assignment-display-section">
        {/* Left Column: Batches */}
        <div className="assignment-column">
          <h4 className="assignment-section-title">{isHeadCoach ? 'All Center Batches' : 'Assigned Batches'} • {assignedBatches.length}</h4>
          
          {assignedBatches.length > 0 ? (
            <div className="assignment-items">
              {assignedBatches.map((batch) => {
                const studentsInBatch = students.filter((s) => s.batchId === batch.id && s.assignedCoachId === selectedCoach.id);
                const isSelected = selectedBatchFilterId === batch.id;
                return (
                  <div
                    key={batch.id}
                    onClick={() => setSelectedBatchFilterId(isSelected ? '' : batch.id)}
                    className={`assignment-item batch-item ${isSelected ? 'active' : ''}`}
                  >
                    <div className="item-content">
                      <p className="item-name">{batch.name}</p>
                      <p className="item-meta">{batch.schedule} • {studentsInBatch.length} students</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnassignBatch(batch.id);
                      }}
                      disabled={isSaving}
                      className="btn-action btn-action--danger"
                      title="Delete"
                      style={isHeadCoach ? { display: 'none' } : undefined}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="assignment-empty">
              <p className="empty-message">No batches assigned</p>
            </div>
          )}
        </div>

        {/* Right Column: Students */}
        <div className="assignment-column">
          <h4 className="assignment-section-title">
            {selectedBatchFilterId
              ? `${getBatchName(selectedBatchFilterId)} Students • ${filteredStudents.length}`
              : `${isHeadCoach ? 'All Center Students' : 'Assigned Students'} • ${assignedStudents.length}`}
          </h4>
          
          {filteredStudents.length > 0 ? (
            <div className="assignment-items">
              {filteredStudents.map((student) => (
                <div key={student.id} className="assignment-item student-item">
                  <div className="item-content">
                    <p className="item-name">{student.fullName}</p>
                    <p className="item-meta">{student.skillLevel} • {student.batchId || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => handleUnassignStudent(student.id)}
                    disabled={isSaving}
                    className="btn-action btn-action--danger"
                    title="Delete"
                    style={isHeadCoach ? { display: 'none' } : undefined}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="assignment-empty">
              <p className="empty-message">
                {selectedBatchFilterId ? 'No students in this batch' : 'No students assigned'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentPanel;

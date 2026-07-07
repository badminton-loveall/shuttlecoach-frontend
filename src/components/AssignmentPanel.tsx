import React, { useState } from 'react';
import type { User, Student, Batch } from '../types';
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
  const assignedBatches = batches.filter((batch) => batch.assignedCoachId === selectedCoach.id);
  const assignedStudents = students.filter((student) => student.assignedCoachId === selectedCoach.id);
  const unassignedBatches = batches.filter((batch) => !batch.assignedCoachId);
  const unassignedStudents = students.filter((student) => !student.assignedCoachId);

  // Handlers
  const handleAssignBatch = () => {
    if (!selectedBatchId) return;
    const batch = batches.find((b) => b.id === selectedBatchId);
    if (!batch) return;

    const updatedBatches = batches.map((b) =>
      b.id === selectedBatchId ? { ...b, assignedCoachId: selectedCoach.id } : b
    );
    const updatedStudents = students.map((student) =>
      student.batchId === selectedBatchId
        ? { ...student, assignedCoachId: selectedCoach.id }
        : student
    );

    onAssignmentChange(updatedStudents, updatedBatches);
    setSelectedBatchId('');
  };

  const handleAssignStudent = () => {
    if (!selectedStudentId) return;
    const updatedStudents = students.map((student) =>
      student.id === selectedStudentId
        ? { ...student, assignedCoachId: selectedCoach.id }
        : student
    );
    onAssignmentChange(updatedStudents, batches);
    setSelectedStudentId('');
  };

  const handleUnassignBatch = (batchId: string) => {
    const updatedBatches = batches.map((b) =>
      b.id === batchId ? { ...b, assignedCoachId: undefined } : b
    );
    const updatedStudents = students.map((student) =>
      student.batchId === batchId && student.assignedCoachId === selectedCoach.id
        ? { ...student, assignedCoachId: undefined }
        : student
    );
    onAssignmentChange(updatedStudents, updatedBatches);
  };

  const handleUnassignStudent = (studentId: string) => {
    const updatedStudents = students.map((student) =>
      student.id === studentId ? { ...student, assignedCoachId: undefined } : student
    );
    onAssignmentChange(updatedStudents, batches);
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
          <h2 className="assignment-title">Assignments for {selectedCoach.name}</h2>
          <p className="assignment-subtitle">Manage batch and student assignments for this coach</p>
        </div>
      </div>

      {/* Assignment Form Card - Separate Above */}
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
              disabled={!selectedBatchId}
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
              disabled={!selectedStudentId}
              className="btn-assign"
            >
              Assign
            </button>
          </div>
        </div>
      </div>

      {/* Current Assignments - Two Column Grid */}
      <div className="assignment-display-section">
        {/* Left Column: Batches */}
        <div className="assignment-column">
          <h4 className="assignment-section-title">Assigned Batches • {assignedBatches.length}</h4>
          
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
                      className="btn-action btn-action--danger"
                      title="Delete"
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
              : `Assigned Students • ${assignedStudents.length}`}
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
                    className="btn-action btn-action--danger"
                    title="Delete"
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

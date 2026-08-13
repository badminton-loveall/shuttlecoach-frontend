import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * CoachAssignmentPanel Component
 * Displays and manages coach assignments and student-coach mappings for a batch.
 * Embedded within BatchesTab as a sub-section per batch.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3, 5.4
 */

interface CoachAssignment {
  id: string;
  coach_id: string;
  coach_name: string;
  role: 'head_coach' | 'assistant_coach';
  created_at: string;
}

interface StudentAssignment {
  student_id: string;
  student_name: string;
  assigned_coach_id: string | null;
}

interface CoachOption {
  id: string;
  name: string;
}

interface CoachAssignmentPanelProps {
  batchId: string;
  readOnly: boolean;
}

const CoachAssignmentPanel: React.FC<CoachAssignmentPanelProps> = ({ batchId, readOnly }) => {
  // Coach assignments state
  const [coaches, setCoaches] = useState<CoachAssignment[]>([]);
  const [students, setStudents] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Expanded sections for per-coach student lists
  const [expandedCoaches, setExpandedCoaches] = useState<Set<string>>(new Set());

  // Assign coach modal state
  const [showAssignCoachModal, setShowAssignCoachModal] = useState(false);
  const [availableCoaches, setAvailableCoaches] = useState<CoachOption[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'head_coach' | 'assistant_coach'>('assistant_coach');
  const [assigningCoach, setAssigningCoach] = useState(false);

  // Remove coach confirmation state
  const [removingCoach, setRemovingCoach] = useState<CoachAssignment | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Student assignment state
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false);
  const [assignStudentTarget, setAssignStudentTarget] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assigningStudent, setAssigningStudent] = useState(false);

  // Move student state
  const [movingStudent, setMovingStudent] = useState<StudentAssignment | null>(null);
  const [moveTargetCoachId, setMoveTargetCoachId] = useState('');
  const [movingStudentLoading, setMovingStudentLoading] = useState(false);

  // Fetch coach assignments for this batch
  const fetchCoaches = useCallback(async () => {
    try {
      const response = await apiClient.get(`/batches/${batchId}/coaches`);
      const data = Array.isArray(response.data) ? response.data : response.data.coaches || [];
      setCoaches(data);
    } catch {
      setError('Failed to load coach assignments.');
    }
  }, [batchId]);

  // Fetch student-coach assignments for this batch
  const fetchStudents = useCallback(async () => {
    try {
      const response = await apiClient.get(`/batches/${batchId}/students/assignments`);
      const data = Array.isArray(response.data) ? response.data : response.data.assignments || [];
      setStudents(data);
    } catch {
      setError('Failed to load student assignments.');
    }
  }, [batchId]);

  // Fetch available coaches for assignment dropdown
  const fetchAvailableCoaches = async () => {
    try {
      const response = await apiClient.get('/coaches');
      const data = Array.isArray(response.data) ? response.data : response.data.coaches || [];
      setAvailableCoaches(data.map((c: any) => ({ id: c.id, name: c.name })));
    } catch {
      // Silently handle — dropdown will be empty
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchCoaches(), fetchStudents()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCoaches, fetchStudents]);

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Derived data
  const headCoach = coaches.find((c) => c.role === 'head_coach') || null;
  const assistantCoaches = coaches.filter((c) => c.role === 'assistant_coach');

  // Get students for a specific coach (unassigned default to head coach)
  const getStudentsForCoach = (coachId: string, isHeadCoach: boolean): StudentAssignment[] => {
    if (isHeadCoach) {
      return students.filter(
        (s) => s.assigned_coach_id === coachId || s.assigned_coach_id === null
      );
    }
    return students.filter((s) => s.assigned_coach_id === coachId);
  };

  // Get unassigned students (those not assigned to any assistant coach)
  const getUnassignedStudents = (): StudentAssignment[] => {
    const assistantCoachIds = new Set(assistantCoaches.map((c) => c.coach_id));
    return students.filter(
      (s) => !s.assigned_coach_id || !assistantCoachIds.has(s.assigned_coach_id)
    );
  };

  // Toggle expanded section
  const toggleExpanded = (coachId: string) => {
    setExpandedCoaches((prev) => {
      const next = new Set(prev);
      if (next.has(coachId)) {
        next.delete(coachId);
      } else {
        next.add(coachId);
      }
      return next;
    });
  };

  // Assign Coach handler
  const handleAssignCoachOpen = () => {
    fetchAvailableCoaches();
    setSelectedCoachId('');
    setSelectedRole(headCoach ? 'assistant_coach' : 'head_coach');
    setShowAssignCoachModal(true);
  };

  const handleAssignCoachSubmit = async () => {
    if (!selectedCoachId) return;
    setAssigningCoach(true);
    try {
      await apiClient.post(`/batches/${batchId}/coaches`, {
        coach_id: selectedCoachId,
        role: selectedRole,
      });
      setSuccessMessage('Coach assigned successfully');
      setShowAssignCoachModal(false);
      await fetchCoaches();
    } catch (err: any) {
      const serverError = err?.response?.data?.error || 'Failed to assign coach.';
      setError(serverError);
    } finally {
      setAssigningCoach(false);
    }
  };

  // Remove Coach handler
  const handleRemoveCoachClick = (coach: CoachAssignment) => {
    setRemovingCoach(coach);
  };

  const handleRemoveCoachConfirm = async () => {
    if (!removingCoach) return;
    setRemoveLoading(true);
    try {
      await apiClient.delete(`/batches/${batchId}/coaches/${removingCoach.coach_id}`);
      setSuccessMessage(
        `Coach removed. Students reassigned to head coach.`
      );
      setRemovingCoach(null);
      await Promise.all([fetchCoaches(), fetchStudents()]);
    } catch (err: any) {
      const serverError = err?.response?.data?.error || 'Failed to remove coach.';
      setError(serverError);
      setRemovingCoach(null);
    } finally {
      setRemoveLoading(false);
    }
  };

  // Assign Student handler
  const handleAssignStudentOpen = (targetCoachId: string) => {
    setAssignStudentTarget(targetCoachId);
    setSelectedStudentId('');
    setShowAssignStudentModal(true);
  };

  const handleAssignStudentSubmit = async () => {
    if (!selectedStudentId || !assignStudentTarget) return;
    setAssigningStudent(true);
    try {
      await apiClient.post(`/batches/${batchId}/students/assign`, {
        student_id: selectedStudentId,
        coach_id: assignStudentTarget,
      });
      setSuccessMessage('Student assigned successfully');
      setShowAssignStudentModal(false);
      await fetchStudents();
    } catch (err: any) {
      const serverError = err?.response?.data?.error || 'Failed to assign student.';
      setError(serverError);
    } finally {
      setAssigningStudent(false);
    }
  };

  // Move Student handler
  const handleMoveStudentOpen = (student: StudentAssignment) => {
    setMovingStudent(student);
    setMoveTargetCoachId('');
  };

  const handleMoveStudentSubmit = async () => {
    if (!movingStudent || !moveTargetCoachId) return;
    setMovingStudentLoading(true);
    try {
      await apiClient.post(`/batches/${batchId}/students/move`, {
        student_id: movingStudent.student_id,
        target_coach_id: moveTargetCoachId,
      });
      setSuccessMessage('Student moved successfully');
      setMovingStudent(null);
      await fetchStudents();
    } catch (err: any) {
      const serverError = err?.response?.data?.error || 'Failed to move student.';
      setError(serverError);
    } finally {
      setMovingStudentLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm text-[var(--text-secondary)]">Loading coach assignments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border border-[var(--border-default)] rounded-lg bg-[var(--surface-card)]">
      {/* Success message */}
      {successMessage && (
        <div
          className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700"
          role="alert"
        >
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline text-red-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Coach Assignments
        </h3>
        {!readOnly && (
          <button
            onClick={handleAssignCoachOpen}
            className="btn btn-primary text-xs px-3 py-1"
            aria-label="Assign Coach"
          >
            Assign Coach
          </button>
        )}
      </div>

      {/* Head Coach Section */}
      <div className="border-b border-[var(--border-default)] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
            Head Coach
          </span>
          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
            Required
          </span>
        </div>
        {headCoach ? (
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {headCoach.coach_name}
              </span>
              <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                Head Coach
              </span>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">
              {getStudentsForCoach(headCoach.coach_id, true).length} students
            </span>
          </div>
        ) : (
          <p className="mt-1 text-xs text-[var(--text-secondary)] italic">
            No head coach assigned. Use "Assign Coach" to add one.
          </p>
        )}

        {/* Expandable student list for head coach */}
        {headCoach && (
          <div className="mt-2">
            <button
              onClick={() => toggleExpanded(headCoach.coach_id)}
              className="text-xs text-blue-600 hover:underline"
              aria-expanded={expandedCoaches.has(headCoach.coach_id)}
            >
              {expandedCoaches.has(headCoach.coach_id) ? '▾ Hide' : '▸ Show'} students
            </button>
            {expandedCoaches.has(headCoach.coach_id) && (
              <StudentList
                students={getStudentsForCoach(headCoach.coach_id, true)}
                coaches={coaches}
                currentCoachId={headCoach.coach_id}
                readOnly={readOnly}
                onMoveStudent={handleMoveStudentOpen}
              />
            )}
          </div>
        )}
      </div>

      {/* Assistant Coaches Section */}
      <div>
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Assistant Coaches ({assistantCoaches.length})
        </span>

        {assistantCoaches.length === 0 ? (
          <p className="mt-1 text-xs text-[var(--text-secondary)] italic">
            No assistant coaches assigned.
          </p>
        ) : (
          <div className="mt-2 space-y-3">
            {assistantCoaches.map((coach) => {
              const coachStudents = getStudentsForCoach(coach.coach_id, false);
              const isExpanded = expandedCoaches.has(coach.coach_id);
              return (
                <div
                  key={coach.id}
                  className="border border-[var(--border-default)] rounded p-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--text-primary)]">
                        {coach.coach_name}
                      </span>
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Assistant
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        ({coachStudents.length} students)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!readOnly && (
                        <>
                          <button
                            onClick={() => handleAssignStudentOpen(coach.coach_id)}
                            className="text-xs text-blue-600 hover:underline"
                            aria-label={`Assign student to ${coach.coach_name}`}
                          >
                            Assign Student
                          </button>
                          <button
                            onClick={() => handleRemoveCoachClick(coach)}
                            className="text-xs text-red-600 hover:underline"
                            aria-label={`Remove ${coach.coach_name}`}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expandable student list */}
                  <div className="mt-1">
                    <button
                      onClick={() => toggleExpanded(coach.coach_id)}
                      className="text-xs text-blue-600 hover:underline"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? '▾ Hide' : '▸ Show'} students
                    </button>
                    {isExpanded && (
                      <StudentList
                        students={coachStudents}
                        coaches={coaches}
                        currentCoachId={coach.coach_id}
                        readOnly={readOnly}
                        onMoveStudent={handleMoveStudentOpen}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}

      {/* Assign Coach Modal */}
      {showAssignCoachModal && (
        <div className="modal-overlay">
          <div
            className="modal-content modal-content--small"
          >
            <div className="modal-header">
              <h2 className="modal-title">Assign Coach</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowAssignCoachModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Coach
                </label>
                <select
                  value={selectedCoachId}
                  onChange={(e) => setSelectedCoachId(e.target.value)}
                  className="w-full border border-[var(--border-default)] rounded px-3 py-2 text-sm bg-[var(--surface-card)]"
                >
                  <option value="">Select a coach...</option>
                  {availableCoaches
                    .filter((c) => !coaches.some((assigned) => assigned.coach_id === c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as 'head_coach' | 'assistant_coach')
                  }
                  disabled={!!headCoach}
                  className="w-full border border-[var(--border-default)] rounded px-3 py-2 text-sm bg-[var(--surface-card)]"
                >
                  {!headCoach && <option value="head_coach">Head Coach</option>}
                  <option value="assistant_coach">Assistant Coach</option>
                </select>
                {headCoach && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Head coach already assigned. New coaches will be assistants.
                  </p>
                )}
              </div>
            </div>
            <div className="modal-footer p-4 flex justify-end gap-2 border-t border-[var(--border-default)]">
              <button
                onClick={() => setShowAssignCoachModal(false)}
                disabled={assigningCoach}
                className="btn btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCoachSubmit}
                disabled={assigningCoach || !selectedCoachId}
                className="btn btn-primary text-sm"
              >
                {assigningCoach ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Coach Confirmation Modal */}
      {removingCoach && (
        <div className="modal-overlay">
          <div
            className="modal-content modal-content--small"
          >
            <div className="modal-header">
              <h2 className="modal-title">Remove Coach?</h2>
              <button className="modal-close-btn" onClick={() => setRemovingCoach(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Are you sure you want to remove{' '}
                <strong>{removingCoach.coach_name}</strong> from this batch?
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                All students currently assigned to this coach will be reassigned to the
                head coach.
              </p>
            </div>
            <div className="modal-footer p-4 flex justify-end gap-2 border-t border-[var(--border-default)]">
              <button
                onClick={() => setRemovingCoach(null)}
                disabled={removeLoading}
                className="btn btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveCoachConfirm}
                disabled={removeLoading}
                className="btn btn-danger text-sm"
              >
                {removeLoading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Student Modal */}
      {showAssignStudentModal && (
        <div className="modal-overlay">
          <div
            className="modal-content modal-content--small"
          >
            <div className="modal-header">
              <h2 className="modal-title">Assign Student</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowAssignStudentModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full border border-[var(--border-default)] rounded px-3 py-2 text-sm bg-[var(--surface-card)]"
                >
                  <option value="">Select a student...</option>
                  {getUnassignedStudents().map((s) => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.student_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer p-4 flex justify-end gap-2 border-t border-[var(--border-default)]">
              <button
                onClick={() => setShowAssignStudentModal(false)}
                disabled={assigningStudent}
                className="btn btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignStudentSubmit}
                disabled={assigningStudent || !selectedStudentId}
                className="btn btn-primary text-sm"
              >
                {assigningStudent ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Student Modal */}
      {movingStudent && (
        <div className="modal-overlay">
          <div
            className="modal-content modal-content--small"
          >
            <div className="modal-header">
              <h2 className="modal-title">Move Student</h2>
              <button className="modal-close-btn" onClick={() => setMovingStudent(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body p-4 space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Move <strong>{movingStudent.student_name}</strong> to another coach:
              </p>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Target Coach
                </label>
                <select
                  value={moveTargetCoachId}
                  onChange={(e) => setMoveTargetCoachId(e.target.value)}
                  className="w-full border border-[var(--border-default)] rounded px-3 py-2 text-sm bg-[var(--surface-card)]"
                >
                  <option value="">Select a coach...</option>
                  {coaches
                    .filter((c) => c.coach_id !== movingStudent.assigned_coach_id)
                    .map((c) => (
                      <option key={c.coach_id} value={c.coach_id}>
                        {c.coach_name} ({c.role === 'head_coach' ? 'Head Coach' : 'Assistant'})
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="modal-footer p-4 flex justify-end gap-2 border-t border-[var(--border-default)]">
              <button
                onClick={() => setMovingStudent(null)}
                disabled={movingStudentLoading}
                className="btn btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveStudentSubmit}
                disabled={movingStudentLoading || !moveTargetCoachId}
                className="btn btn-primary text-sm"
              >
                {movingStudentLoading ? 'Moving...' : 'Move'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * StudentList — sub-component for showing students under a coach
 */
interface StudentListProps {
  students: StudentAssignment[];
  coaches: CoachAssignment[];
  currentCoachId: string;
  readOnly: boolean;
  onMoveStudent: (student: StudentAssignment) => void;
}

const StudentList: React.FC<StudentListProps> = ({
  students,
  coaches,
  currentCoachId: _currentCoachId,
  readOnly,
  onMoveStudent,
}) => {
  if (students.length === 0) {
    return (
      <p className="text-xs text-[var(--text-secondary)] mt-1 italic pl-2">
        No students assigned.
      </p>
    );
  }

  return (
    <ul className="mt-1 pl-2 space-y-1">
      {students.map((student) => (
        <li
          key={student.student_id}
          className="flex items-center justify-between text-xs text-[var(--text-primary)] py-0.5"
        >
          <span>{student.student_name}</span>
          {!readOnly && coaches.length > 1 && (
            <button
              onClick={() => onMoveStudent(student)}
              className="text-xs text-blue-600 hover:underline"
              aria-label={`Move ${student.student_name}`}
            >
              Move
            </button>
          )}
        </li>
      ))}
    </ul>
  );
};

export default CoachAssignmentPanel;

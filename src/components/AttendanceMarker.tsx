import React, { useState, useMemo, useCallback } from 'react';
import type {
  AttendanceStatus,
  LeaveType,
  Batch,
  Student,
} from '../types';
import { useMarkAttendance, type MarkAttendanceEntry } from '../hooks/useAttendance';

/**
 * AttendanceMarker Component
 * Renders a batch student list with Present/Absent/Late toggle buttons.
 * Shows leave type dropdown when a student is marked Absent.
 * Supports batch selector and date picker.
 *
 * Requirements: 1.1, 2.1
 */

export interface AttendanceMarkerProps {
  batches: Batch[];
  students: Student[];
  selectedBatchId: string;
  onBatchChange: (batchId: string) => void;
  onSubmitSuccess?: () => void;
}

interface StudentAttendanceState {
  status: AttendanceStatus;
  leaveType?: LeaveType;
}

const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: 'PLANNED_LEAVE', label: 'Planned Leave' },
  { value: 'SICK_LEAVE', label: 'Sick Leave' },
  { value: 'NO_SHOW', label: 'No Show' },
];

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; activeClass: string }> = {
  PRESENT: { label: 'Present', activeClass: 'bg-green-600 text-white' },
  ABSENT: { label: 'Absent', activeClass: 'bg-red-600 text-white' },
  LATE: { label: 'Late', activeClass: 'bg-yellow-500 text-white' },
};

export const AttendanceMarker: React.FC<AttendanceMarkerProps> = ({
  batches,
  students,
  selectedBatchId,
  onBatchChange,
  onSubmitSuccess,
}) => {
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, StudentAttendanceState>
  >({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { markAttendance, loading: submitting, error: submitError, reset } = useMarkAttendance();

  // Filter students for the selected batch
  const batchStudents = useMemo(
    () => students.filter((s) => s.batchId === selectedBatchId),
    [students, selectedBatchId]
  );

  // Get attendance state for a student
  const getStudentState = useCallback(
    (studentId: string): StudentAttendanceState => {
      return attendanceMap[studentId] || { status: 'PRESENT' };
    },
    [attendanceMap]
  );

  // Toggle student status
  const handleStatusChange = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      setAttendanceMap((prev) => ({
        ...prev,
        [studentId]: {
          status,
          leaveType: status === 'ABSENT' ? prev[studentId]?.leaveType : undefined,
        },
      }));
      setSubmitSuccess(false);
      reset();
    },
    [reset]
  );

  // Handle leave type change
  const handleLeaveTypeChange = useCallback(
    (studentId: string, leaveType: LeaveType) => {
      setAttendanceMap((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          status: 'ABSENT',
          leaveType,
        },
      }));
      setSubmitSuccess(false);
    },
    []
  );

  // Handle batch change - reset attendance map
  const handleBatchChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newBatchId = e.target.value;
      onBatchChange(newBatchId);
      setAttendanceMap({});
      setSubmitSuccess(false);
      reset();
    },
    [onBatchChange, reset]
  );

  // Handle date change
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSessionDate(e.target.value);
      setSubmitSuccess(false);
      reset();
    },
    [reset]
  );

  // Submit attendance
  const handleSubmit = useCallback(async () => {
    if (!selectedBatchId || batchStudents.length === 0) return;

    const records: MarkAttendanceEntry[] = batchStudents.map((student) => {
      const state = getStudentState(student.id);
      return {
        studentId: student.id,
        status: state.status,
        ...(state.status === 'ABSENT' && state.leaveType
          ? { leaveType: state.leaveType }
          : {}),
      };
    });

    try {
      await markAttendance({
        batchId: selectedBatchId,
        sessionDate,
        records,
      });
      setSubmitSuccess(true);
      onSubmitSuccess?.();
    } catch {
      // Error is handled in the hook state
    }
  }, [selectedBatchId, batchStudents, getStudentState, sessionDate, markAttendance, onSubmitSuccess]);

  // Mark all students with the same status
  const handleMarkAll = useCallback(
    (status: AttendanceStatus) => {
      const newMap: Record<string, StudentAttendanceState> = {};
      batchStudents.forEach((student) => {
        newMap[student.id] = { status };
      });
      setAttendanceMap(newMap);
      setSubmitSuccess(false);
      reset();
    },
    [batchStudents, reset]
  );

  return (
    <div className="space-y-6">
      {/* Batch Selector and Date Picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {/* Batch Selector */}
        <div className="flex-1">
          <label
            htmlFor="batch-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Batch
          </label>
          <select
            id="batch-select"
            value={selectedBatchId}
            onChange={handleBatchChange}
            className="w-full rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ border: '1px solid var(--border-default)' }}
          >
            <option value="">Select a batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Picker */}
        <div className="flex-1">
          <label
            htmlFor="session-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Session Date
          </label>
          <input
            id="session-date"
            type="date"
            value={sessionDate}
            onChange={handleDateChange}
            className="w-full rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ border: '1px solid var(--border-default)' }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      {selectedBatchId && batchStudents.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Mark all:</span>
          <button
            type="button"
            onClick={() => handleMarkAll('PRESENT')}
            className="rounded px-3 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
          >
            Present
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll('ABSENT')}
            className="rounded px-3 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
          >
            Absent
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll('LATE')}
            className="rounded px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
          >
            Late
          </button>
        </div>
      )}

      {/* Student List */}
      {!selectedBatchId && (
        <p className="text-center text-sm text-gray-500 py-8">
          Select a batch to mark attendance.
        </p>
      )}

      {selectedBatchId && batchStudents.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-8">
          No students found in the selected batch.
        </p>
      )}

      {selectedBatchId && batchStudents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Students ({batchStudents.length})
            </h3>
          </div>

          <ul className="divide-y rounded-lg" style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-card)', '--tw-divide-color': 'var(--border-default)' } as React.CSSProperties}>
            {batchStudents.map((student) => {
              const state = getStudentState(student.id);
              return (
                <li
                  key={student.id}
                  className="p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Student Name */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {student.fullName}
                      </p>
                      {student.baidNumber && (
                        <p className="text-xs text-gray-500">
                          BAID: {student.baidNumber}
                        </p>
                      )}
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex gap-1">
                      {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(
                        (status) => {
                          const config = STATUS_CONFIG[status];
                          const isActive = state.status === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() =>
                                handleStatusChange(student.id, status)
                              }
                              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                isActive
                                  ? config.activeClass
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              aria-pressed={isActive}
                              aria-label={`Mark ${student.fullName} as ${config.label}`}
                            >
                              {config.label}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Leave Type Dropdown (shown when Absent) */}
                  {state.status === 'ABSENT' && (
                    <div className="mt-3 sm:ml-auto sm:max-w-xs">
                      <label
                        htmlFor={`leave-type-${student.id}`}
                        className="block text-xs font-medium text-gray-600 mb-1"
                      >
                        Leave Type
                      </label>
                      <select
                        id={`leave-type-${student.id}`}
                        value={state.leaveType || ''}
                        onChange={(e) =>
                          handleLeaveTypeChange(
                            student.id,
                            e.target.value as LeaveType
                          )
                        }
                        className="w-full rounded px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        style={{ border: '1px solid var(--border-default)' }}
                      >
                        <option value="">Select leave type</option>
                        {LEAVE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Submit Button and Status */}
      {selectedBatchId && batchStudents.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selectedBatchId}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Attendance'}
          </button>

          {/* Success Message */}
          {submitSuccess && (
            <p className="text-sm font-medium text-green-600" role="alert">
              Attendance recorded successfully.
            </p>
          )}

          {/* Error Message */}
          {submitError && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {submitError}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceMarker;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { AttendanceMarker } from '../components/AttendanceMarker';
import { useAttendanceRecords, type AttendanceFilters } from '../hooks/useAttendance';
import { useStudents } from '../hooks/useStudents';
import type { Batch, AttendanceRecord } from '../types';
import apiClient from '../utils/apiClient';

/**
 * AttendancePage
 * Page for coaches to mark attendance and view attendance history.
 * Integrates AttendanceMarker with batch/date selection.
 * Shows confirmation toast on successful submission.
 * Displays attendance history table with filters.
 *
 * Requirements: 1.1, 1.5, 4.2, 13.1
 */

const STATUS_STYLES: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-800',
  ABSENT: 'bg-red-100 text-red-800',
  LATE: 'bg-yellow-100 text-yellow-800',
};

const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  PLANNED_LEAVE: 'Planned Leave',
  SICK_LEAVE: 'Sick Leave',
  NO_SHOW: 'No Show',
};

const AttendancePage: React.FC = () => {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'mark' | 'history'>('mark');

  // History filters
  const [historyBatchFilter, setHistoryBatchFilter] = useState<string>('');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');

  // ─── Fetch Batches ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadBatches = async () => {
      try {
        const response = await apiClient.get('/batches');
        const batchData = response.data.batches || response.data;
        setBatches(Array.isArray(batchData) ? batchData : []);
      } catch {
        setBatches([]);
      }
    };
    void loadBatches();
  }, []);

  // ─── Fetch Students ────────────────────────────────────────────────────────
  const studentFilters = useMemo(
    () => (selectedBatchId ? { batch: selectedBatchId } : undefined),
    [selectedBatchId]
  );
  const { students } = useStudents(studentFilters);

  // ─── Attendance Records (History) ──────────────────────────────────────────
  const attendanceFilters: AttendanceFilters | undefined = useMemo(() => {
    const filters: AttendanceFilters = {};
    if (historyBatchFilter) filters.batchId = historyBatchFilter;
    if (historyStartDate) filters.startDate = historyStartDate;
    if (historyEndDate) filters.endDate = historyEndDate;
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [historyBatchFilter, historyStartDate, historyEndDate]);

  const { records, loading: recordsLoading, error: recordsError, refetch } = useAttendanceRecords(attendanceFilters);

  // ─── Toast Helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── Submit Success Handler ────────────────────────────────────────────────
  const handleSubmitSuccess = useCallback(() => {
    showToast('Attendance recorded successfully!', 'success');
    void refetch();
  }, [showToast, refetch]);

  // ─── Format Date ───────────────────────────────────────────────────────────
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // ─── Get Student Name ──────────────────────────────────────────────────────
  const getStudentName = useCallback(
    (studentId: string): string => {
      const student = students.find((s) => s.id === studentId);
      return student?.fullName || studentId.slice(0, 8) + '...';
    },
    [students]
  );

  // ─── Get Batch Name ────────────────────────────────────────────────────────
  const getBatchName = useCallback(
    (batchId: string): string => {
      const batch = batches.find((b) => b.id === batchId);
      return batch?.name || batchId.slice(0, 8) + '...';
    },
    [batches]
  );

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
          {/* Toast notification */}
          {toast && (
            <div
              className={`fixed top-4 right-4 z-50 rounded-md px-4 py-3 text-sm font-medium shadow-lg transition-all ${
                toast.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
              role="alert"
              aria-live="polite"
            >
              {toast.message}
            </div>
          )}

          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Attendance</h1>
              <p className="page-header-subtitle">
                Mark daily attendance and view attendance history
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="sp-tab-nav">
            <button
              onClick={() => setActiveTab('mark')}
              className={`sp-tab${activeTab === 'mark' ? ' sp-tab--active' : ''}`}
            >
              Mark Attendance
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`sp-tab${activeTab === 'history' ? ' sp-tab--active' : ''}`}
            >
              History
            </button>
          </div>

          {/* Mark Attendance Tab */}
          {activeTab === 'mark' && (
            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-lg)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <AttendanceMarker
                batches={batches}
                students={students}
                selectedBatchId={selectedBatchId}
                onBatchChange={setSelectedBatchId}
                onSubmitSuccess={handleSubmitSuccess}
              />
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-4">
              {/* Filters */}
              <div
                style={{
                  backgroundColor: 'var(--surface-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  {/* Batch Filter */}
                  <div className="flex-1">
                    <label
                      htmlFor="history-batch-filter"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Batch
                    </label>
                    <select
                      id="history-batch-filter"
                      value={historyBatchFilter}
                      onChange={(e) => setHistoryBatchFilter(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{
                        backgroundColor: 'var(--surface-card)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="">All Batches</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date Filter */}
                  <div className="flex-1">
                    <label
                      htmlFor="history-start-date"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      From
                    </label>
                    <input
                      id="history-start-date"
                      type="date"
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{
                        backgroundColor: 'var(--surface-card)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* End Date Filter */}
                  <div className="flex-1">
                    <label
                      htmlFor="history-end-date"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      To
                    </label>
                    <input
                      id="history-end-date"
                      type="date"
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{
                        backgroundColor: 'var(--surface-card)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Clear Filters */}
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryBatchFilter('');
                      setHistoryStartDate('');
                      setHistoryEndDate('');
                    }}
                    className="btn btn-secondary"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {recordsLoading && (
                <div
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2xl)',
                  }}
                >
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {recordsError && (
                <div
                  className="rounded-md p-4 text-sm"
                  style={{
                    backgroundColor: 'var(--feedback-danger-light)',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger)',
                  }}
                >
                  {recordsError}
                </div>
              )}

              {/* Empty State */}
              {!recordsLoading && !recordsError && records.length === 0 && (
                <div
                  className="text-center"
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2xl)',
                  }}
                >
                  <svg
                    className="mx-auto h-12 w-12"
                    style={{ color: 'var(--text-tertiary)' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    No attendance records found. Try adjusting your filters or mark attendance first.
                  </p>
                </div>
              )}

              {/* Attendance History Table */}
              {!recordsLoading && !recordsError && records.length > 0 && (
                <div
                  className="overflow-hidden"
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div className="overflow-x-auto">
                    <table className="table-styled">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Student</th>
                          <th>Batch</th>
                          <th>Status</th>
                          <th>Leave Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record: AttendanceRecord) => (
                          <tr key={record.id}>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {formatDate(record.sessionDate)}
                            </td>
                            <td>
                              {getStudentName(record.studentId)}
                            </td>
                            <td>
                              {getBatchName(record.batchId)}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  STATUS_STYLES[record.status] || ''
                                }`}
                              >
                                {STATUS_LABELS[record.status] || record.status}
                              </span>
                            </td>
                            <td className="text-muted">
                              {record.leaveType
                                ? LEAVE_TYPE_LABELS[record.leaveType] || record.leaveType
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Record Count */}
                  <div
                    className="px-4 py-3"
                    style={{
                      backgroundColor: 'var(--surface-hover)',
                      borderTop: '1px solid var(--border-default)',
                    }}
                  >
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Showing {records.length} record{records.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendancePage;

import { useCallback, useEffect, useState } from 'react';
import apiClient from '../utils/apiClient';
import { ResetPasswordModal } from './ResetPasswordModal';
import type { Student } from '../types';

interface AdminCenterStudentsProps {
  centerId: string;
}

const PAGE_SIZE = 20;

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
    if (message) return message;
  }
  return fallback;
}

/**
 * Admin view of one center's students, with per-student account actions:
 *  - Resend Invite: re-sends the enrollment welcome email with a fresh link.
 *  - Reset Password: the same shared modal head coaches use (set directly or email a link).
 * Both backend routes create the student's login account first if it's missing.
 */
export function AdminCenterStudents({ centerId }: AdminCenterStudentsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<Student | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await apiClient.get<{ students: Student[]; total: number }>('/students', {
        params: {
          center_id: centerId,
          page: String(page),
          limit: String(PAGE_SIZE),
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        },
      });
      setStudents(response.data.students);
      setTotal(response.data.total);
    } catch (err: unknown) {
      setLoadError(getErrorMessage(err, 'Failed to load students.'));
    } finally {
      setLoading(false);
    }
  }, [centerId, page, debouncedSearch]);

  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  const handleResendInvite = async (student: Student) => {
    try {
      setInvitingId(student.id);
      setActionError(null);
      setActionSuccess(null);
      const response = await apiClient.post<{ message: string }>(`/students/${student.id}/resend-invite`);
      setActionSuccess(response.data.message || `Invite sent to ${student.email}.`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, `Failed to send invite to ${student.fullName}.`));
    } finally {
      setInvitingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <input
        className="form-input"
        type="search"
        placeholder="Search students by name or BAID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search students"
        style={{ marginBottom: 'var(--space-md)' }}
      />

      {actionError && (
        <div className="center-detail-page__inline-error">
          <p>{actionError}</p>
        </div>
      )}
      {actionSuccess && (
        <div className="center-detail-page__inline-success">
          <p>{actionSuccess}</p>
        </div>
      )}
      {loadError && (
        <div className="center-detail-page__inline-error">
          <p>{loadError}</p>
        </div>
      )}

      <div className="table-filter-section">
        {loading ? (
          <div className="table-empty">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="table-empty">
            {debouncedSearch ? 'No students match your search.' : 'No students in this center yet.'}
          </div>
        ) : (
          <div className="table-container">
            <table className="table-styled">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="text-bold">{student.fullName}</td>
                    <td className="text-muted">{student.email || 'No email on file'}</td>
                    <td>
                      <div className="center-detail-page__owner-actions">
                        <button
                          className="center-detail-page__invite-btn"
                          onClick={() => handleResendInvite(student)}
                          disabled={!student.email || invitingId !== null}
                          title={student.email ? undefined : 'Add an email to this student first'}
                        >
                          {invitingId === student.id ? 'Sending...' : 'Resend Invite'}
                        </button>
                        <button
                          className="center-detail-page__reset-btn"
                          onClick={() => setResetTarget(student)}
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between" style={{ marginTop: 'var(--space-sm)' }}>
          <span className="text-sm text-muted">
            Page {page} of {totalPages} · {total} students
          </span>
          <div className="center-detail-page__owner-actions">
            <button
              className="btn btn-secondary text-sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || loading}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary text-sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || loading}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {resetTarget && (
        <ResetPasswordModal
          targetName={resetTarget.fullName}
          apiPath={`/students/${resetTarget.id}/reset-password`}
          sendEmailApiPath={`/students/${resetTarget.id}/send-reset-email`}
          onClose={() => setResetTarget(null)}
        />
      )}
    </>
  );
}

export default AdminCenterStudents;

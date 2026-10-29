import { useEffect, useState } from 'react';
import apiClient from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';
import '../styles/pages.css';

/**
 * BatchJoinRequestsPanel Component
 * Pending requests submitted through a batch invite link. The head coach approves (choosing
 * start date, coach and optional monthly fee — this creates the student, their login and the
 * enrollment into that batch) or rejects each one. Renders nothing when there are none.
 */

interface JoinRequest {
  id: string;
  batchTimeTemplateId: string;
  batchName: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  contactPhone: string;
  email: string;
  guardianName: string | null;
  guardianPhone: string | null;
  medicalConditions: string | null;
  skillLevel: string | null;
  notes: string | null;
  createdAt: string;
}

interface CoachOption {
  id: string;
  name: string;
}

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const ageFrom = (dob: string) => {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

const BatchJoinRequestsPanel: React.FC = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [coaches, setCoaches] = useState<CoachOption[]>([]);

  const [approving, setApproving] = useState<JoinRequest | null>(null);
  const [startDate, setStartDate] = useState(todayIso());
  const [coachId, setCoachId] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState<JoinRequest | null>(null);

  const fetchRequests = () =>
    apiClient
      .get('/batch-join-requests', { params: { status: 'pending' } })
      .then((response) => setRequests(Array.isArray(response.data) ? response.data : []))
      // Non-critical panel — leave the batch list usable if this fails
      .catch(() => setRequests([]));

  useEffect(() => {
    fetchRequests();
    apiClient
      .get('/coaches')
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : r.data.coaches || [];
        setCoaches(data.map((c: CoachOption) => ({ id: c.id, name: c.name })));
      })
      .catch(() => setCoaches([]));
  }, []);

  if (requests.length === 0) return null;

  const openApprove = (request: JoinRequest) => {
    setApproving(request);
    setStartDate(todayIso());
    setCoachId('');
    setMonthlyFee('');
  };

  const handleApprove = async () => {
    if (!approving || !startDate) return;
    setSubmitting(true);
    try {
      const response = await apiClient.post(`/batch-join-requests/${approving.id}/approve`, {
        startDate,
        coachId: coachId || null,
        monthlyFee: monthlyFee ? Number(monthlyFee) : null,
      });
      showToast({
        message: response.data.loginCreated
          ? `${approving.fullName} added to ${approving.batchName}. A welcome email with login details was sent.`
          : `${approving.fullName} added to ${approving.batchName}. Their email is already used by another account, so no login was created.`,
        type: 'success',
        duration: 5000,
      });
      setApproving(null);
      fetchRequests();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to approve request.';
      showToast({ message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/batch-join-requests/${rejecting.id}/reject`);
      showToast({ message: `Request from ${rejecting.fullName} rejected`, type: 'success' });
      setRejecting(null);
      fetchRequests();
    } catch {
      showToast({ message: 'Failed to reject request.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="card-title flex items-center gap-2">
        Join Requests <span className="badge-base badge-warning">{requests.length} pending</span>
      </h2>
      <div className="table-filter-section">
        <div className="table-container">
          <table className="table-styled">
            <thead>
              <tr>
                <th>Student</th>
                <th>Batch</th>
                <th>Contact</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 'var(--weight-semibold)' }}>{r.fullName}</div>
                    <div className="text-muted text-sm">
                      {r.gender}, {ageFrom(r.dateOfBirth)} yrs{r.skillLevel ? ` · ${r.skillLevel}` : ''}
                    </div>
                    {r.guardianName && (
                      <div className="text-muted text-sm">
                        Guardian: {r.guardianName} ({r.guardianPhone})
                      </div>
                    )}
                    {r.medicalConditions && (
                      <div className="text-muted text-sm">Medical: {r.medicalConditions}</div>
                    )}
                    {r.notes && <div className="text-muted text-sm">Note: {r.notes}</div>}
                  </td>
                  <td className="text-muted">{r.batchName}</td>
                  <td className="text-muted">
                    <div>{r.contactPhone}</div>
                    <div className="text-sm">{r.email}</div>
                  </td>
                  <td className="text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openApprove(r)}
                        className="table-action-link table-action-link--success"
                        aria-label={`Approve ${r.fullName}`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejecting(r)}
                        className="table-action-link table-action-link--danger"
                        aria-label={`Reject ${r.fullName}`}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {approving && (
        <div className="modal-overlay">
          <div className="modal-content modal-content--small" role="dialog" aria-labelledby="approve-title">
            <div className="modal-header">
              <h2 className="modal-title" id="approve-title">Approve {approving.fullName}</h2>
              <button className="modal-close-btn" onClick={() => setApproving(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="modal-body space-y-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Adds them to <strong>{approving.batchName}</strong> and emails their login details
                to {approving.email}.
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="approve-start-date">Start date</label>
                <input
                  id="approve-start-date"
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="approve-coach">Coach (optional)</label>
                <select
                  id="approve-coach"
                  className="form-input"
                  value={coachId}
                  onChange={(e) => setCoachId(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">Not assigned</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="approve-fee">Monthly fee (optional)</label>
                <input
                  id="approve-fee"
                  type="number"
                  min="0"
                  className="form-input"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(e.target.value)}
                  placeholder="e.g. 2500"
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setApproving(null)} disabled={submitting} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleApprove} disabled={submitting || !startDate} className="btn btn-primary">
                {submitting ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejecting && (
        <div className="modal-overlay">
          <div className="modal-content modal-content--small">
            <div className="modal-header">
              <h2 className="modal-title">Reject request?</h2>
              <button className="modal-close-btn" onClick={() => setRejecting(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-[var(--text-secondary)]">
                <strong>{rejecting.fullName}</strong> will not be added to {rejecting.batchName}.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setRejecting(null)} disabled={submitting} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleReject} disabled={submitting} className="btn btn-danger">
                {submitting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchJoinRequestsPanel;

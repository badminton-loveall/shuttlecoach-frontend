import { useEffect, useState } from 'react';
import apiClient from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';
import '../styles/pages.css';

/**
 * BatchInviteLinkModal Component
 * Shows a batch's shareable invite link (/join/:token) for the head coach to copy and send
 * to prospective students. Students who open it fill in their details and a join request
 * waits for head coach approval. "Reset link" issues a new token, so old links stop working.
 */

interface BatchInviteLinkModalProps {
  batch: { id: string; name: string };
  onClose: () => void;
}

const buildInviteUrl = (token: string) => `${window.location.origin}/join/${token}`;

const BatchInviteLinkModal: React.FC<BatchInviteLinkModalProps> = ({ batch, onClose }) => {
  const { showToast } = useToast();
  const [inviteUrl, setInviteUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const requestToken = async (regenerate: boolean): Promise<string> => {
    const response = await apiClient.post(`/batch-time-templates/${batch.id}/invite-link`, {
      regenerate,
    });
    return response.data.token;
  };

  useEffect(() => {
    requestToken(false)
      .then((token) => setInviteUrl(buildInviteUrl(token)))
      .catch(() => setError('Failed to load the invite link. Please try again.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    try {
      setInviteUrl(buildInviteUrl(await requestToken(true)));
      showToast({ message: 'New invite link created. The old link no longer works.', type: 'success' });
    } catch {
      setError('Failed to reset the invite link. Please try again.');
    } finally {
      setLoading(false);
      setConfirmReset(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast({ message: 'Invite link copied', type: 'success' });
    } catch {
      showToast({ message: 'Could not copy automatically — select the link and copy it.', type: 'error' });
    }
  };

  const shareText = `Join the "${batch.name}" batch: ${inviteUrl}`;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content--small" role="dialog" aria-labelledby="invite-link-title">
        <div className="modal-header">
          <h2 className="modal-title" id="invite-link-title">Invite to {batch.name}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Share this link with students. They fill in their details, and they join the batch
            once you approve their request on this page.
          </p>

          {error && <div className="form-error-banner">{error}</div>}

          <div className="flex gap-2">
            <input
              type="text"
              className="form-input flex-1"
              value={loading && !inviteUrl ? 'Generating link…' : inviteUrl}
              readOnly
              onFocus={(e) => e.target.select()}
              aria-label="Invite link"
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCopy}
              disabled={!inviteUrl || loading}
            >
              Copy
            </button>
          </div>

          {inviteUrl && (
            <div className="flex gap-3 mt-3 text-sm">
              <a
                className="table-action-link table-action-link--info"
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on WhatsApp
              </a>
              {!confirmReset ? (
                <button
                  type="button"
                  className="table-action-link table-action-link--danger"
                  onClick={() => setConfirmReset(true)}
                  disabled={loading}
                >
                  Reset link
                </button>
              ) : (
                <span className="text-[var(--text-secondary)]">
                  Old link will stop working.{' '}
                  <button
                    type="button"
                    className="table-action-link table-action-link--danger"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Confirm reset
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchInviteLinkModal;

import React, { useState, useEffect } from 'react';

/**
 * WaiveFeeModal Component
 * Modal dialog for waiving a fee with a reason
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */

interface WaiveFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  studentName?: string;
  feeAmount?: number;
}

export const WaiveFeeModal: React.FC<WaiveFeeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  studentName,
  feeAmount,
}) => {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate reason is not empty
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(reason.trim());
      onClose();
    } catch (error) {
      console.error('Error waiving fee:', error);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content modal-content--small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Waive Fee</h2>
            {studentName && <p className="modal-subtitle">Student: {studentName}</p>}
            {feeAmount !== undefined && (
              <p className="modal-subtitle">Amount: {formatCurrency(feeAmount)}</p>
            )}
          </div>
          <button type="button" className="modal-close-btn" onClick={handleCancel} disabled={isSubmitting}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-body">
            <div className="form-group">
              <label htmlFor="reason" className="form-label">Reason for waiving fee <span className="form-required">*</span></label>
              <textarea id="reason" value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for waiving this fee (e.g., financial hardship, exceptional performance)"
                rows={4} required
                className="form-input form-textarea" disabled={isSubmitting} />
              <span className="form-helper-text">This reason will be stored in the fee record notes field</span>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-danger" disabled={isSubmitting || !reason.trim()}>
              {isSubmitting ? 'Waiving...' : 'Waive Fee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WaiveFeeModal;

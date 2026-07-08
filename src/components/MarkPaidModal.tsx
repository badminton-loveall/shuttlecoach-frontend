import React, { useState, useEffect } from 'react';
import type { PaymentMethod } from '../types';

/**
 * MarkPaidModal Component
 * Modal dialog for recording fee payment details when marking a fee as paid
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

interface MarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentData: PaymentFormData) => void;
  studentName?: string;
  feeAmount?: number;
}

export interface PaymentFormData {
  paymentMethod: PaymentMethod;
  paidDate: string; // ISO date string
  transactionRef?: string;
  notes?: string;
}

export const MarkPaidModal: React.FC<MarkPaidModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  studentName,
  feeAmount,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidDate, setPaidDate] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize paid date to today when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setPaidDate(today);
      setPaymentMethod('CASH');
      setTransactionRef('');
      setNotes('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const paymentData: PaymentFormData = {
        paymentMethod,
        paidDate,
        transactionRef: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await onSubmit(paymentData);
      onClose();
    } catch (error) {
      console.error('Error submitting payment:', error);
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
            <h2 className="modal-title">Mark Fee as Paid</h2>
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
              <label className="form-label">Payment Method <span className="form-required">*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)' }}>
                {(['CASH', 'UPI', 'BANK_TRANSFER'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      padding: 'var(--space-sm)',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${paymentMethod === method ? 'var(--color-primary)' : 'var(--border-default)'}`,
                      background: paymentMethod === method ? 'rgba(184,225,53,0.1)' : 'transparent',
                      color: paymentMethod === method ? 'var(--color-primary-dark)' : 'var(--text-secondary)',
                      fontWeight: 'var(--weight-semibold)' as any,
                      fontSize: 'var(--font-xs)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {method === 'BANK_TRANSFER' ? 'Bank' : method}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="paid-date" className="form-label">Paid Date <span className="form-required">*</span></label>
              <input type="date" id="paid-date" value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required className="form-input" disabled={isSubmitting} />
            </div>

            <div className="form-group">
              <label htmlFor="transaction-ref" className="form-label">Transaction Reference <span className="form-optional">(optional)</span></label>
              <input type="text" id="transaction-ref" value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g., UPI ID, Check number, Transfer ID"
                className="form-input" disabled={isSubmitting} />
            </div>

            <div className="form-group">
              <label htmlFor="notes" className="form-label">Notes <span className="form-optional">(optional)</span></label>
              <textarea id="notes" value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this payment"
                rows={3} className="form-input form-textarea" disabled={isSubmitting} />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !paidDate}>
              {isSubmitting ? 'Processing...' : 'Mark as Paid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarkPaidModal;

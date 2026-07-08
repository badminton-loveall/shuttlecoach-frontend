import React, { useState, useMemo } from 'react';
import type { Student, FeeRecord } from '../types';
import './EditFeeModal.css';

interface EditFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feeData: EditFeeFormData) => void;
  fee: FeeRecord | null;
  student: Student | null;
}

export interface EditFeeFormData {
  feeId: string;
  amount: number;
  dueDate: Date;
  notes?: string;
}

export const EditFeeModal: React.FC<EditFeeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  fee,
  student,
}) => {
  const [formData, setFormData] = useState<EditFeeFormData>({
    feeId: '',
    amount: 0,
    dueDate: new Date(),
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  // Track which fields have changed
  const hasChanges = useMemo(() => {
    if (!fee) return false;
    return (
      formData.amount !== fee.amount ||
      formData.dueDate.getTime() !== new Date(fee.dueDate).getTime() ||
      formData.notes !== (fee.notes || '')
    );
  }, [formData, fee]);

  // Initialize form when modal opens
  React.useEffect(() => {
    if (isOpen && fee) {
      setFormData({
        feeId: fee.id,
        amount: fee.amount,
        dueDate: new Date(fee.dueDate),
        notes: fee.notes || '',
      });
      setChangedFields(new Set());
      setErrors({});
    }
  }, [isOpen, fee]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.amount > 999999.99) {
      newErrors.amount = 'Amount cannot exceed ₹999,999.99';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Please select a due date';
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      onSubmit(formData);

      // Reset form
      setFormData({
        feeId: '',
        amount: 0,
        dueDate: new Date(),
        notes: '',
      });
      setChangedFields(new Set());
      setErrors({});
    } catch (error) {
      setErrors({ submit: 'Failed to update fee. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle amount change
  const handleAmountChange = (amount: string) => {
    const numAmount = amount === '' ? 0 : parseFloat(amount);
    setFormData({ ...formData, amount: isNaN(numAmount) ? 0 : numAmount });
    setChangedFields(new Set([...changedFields, 'amount']));
    if (errors.amount) {
      setErrors({ ...errors, amount: '' });
    }
  };

  // Handle due date change
  const handleDueDateChange = (dateString: string) => {
    const date = new Date(dateString);
    setFormData({ ...formData, dueDate: date });
    setChangedFields(new Set([...changedFields, 'dueDate']));
    if (errors.dueDate) {
      setErrors({ ...errors, dueDate: '' });
    }
  };

  // Handle notes change
  const handleNotesChange = (notes: string) => {
    setFormData({ ...formData, notes });
    setChangedFields(new Set([...changedFields, 'notes']));
    if (errors.notes) {
      setErrors({ ...errors, notes: '' });
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData({
      feeId: '',
      amount: 0,
      dueDate: new Date(),
      notes: '',
    });
    setChangedFields(new Set());
    setErrors({});
    onClose();
  };

  if (!isOpen || !fee || !student) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Fee</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* General error */}
          {errors.submit && (
            <div className="form-error-banner">{errors.submit}</div>
          )}

          <div className="modal-form-body">
          {/* Student Info (Read-Only) */}
          <div className="form-group">
            <label className="form-label">Student</label>
            <div className="form-read-only">
              {student.fullName}
              {student.baidNumber && (
                <span className="form-read-only-sub">({student.baidNumber})</span>
              )}
            </div>
          </div>

          {/* Month/Year (Read-Only) */}
          <div className="form-group">
            <label className="form-label">Month/Year</label>
            <div className="form-read-only">{fee.monthYear}</div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label htmlFor="amount" className="form-label">
              Amount (₹) {changedFields.has('amount') && <span className="form-changed">✎</span>}
            </label>
            <input
              id="amount"
              type="number"
              min="0.01"
              max="999999.99"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={`form-input ${
                errors.amount ? 'form-input-error' : ''
              }`}
              placeholder="0.00"
              disabled={isSubmitting}
            />
            {errors.amount && (
              <span className="form-error-text">{errors.amount}</span>
            )}
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label htmlFor="dueDate" className="form-label">
              Due Date {changedFields.has('dueDate') && <span className="form-changed">✎</span>}
            </label>
            <input
              id="dueDate"
              type="date"
              value={formData.dueDate.toISOString().split('T')[0]}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className={`form-input ${
                errors.dueDate ? 'form-input-error' : ''
              }`}
              disabled={isSubmitting}
            />
            {errors.dueDate && (
              <span className="form-error-text">{errors.dueDate}</span>
            )}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Notes <span className="form-optional">(optional)</span>{' '}
              {changedFields.has('notes') && <span className="form-changed">✎</span>}
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className={`form-input form-textarea ${
                errors.notes ? 'form-input-error' : ''
              }`}
              placeholder="Add any notes about this fee..."
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
            />
            <div className="form-helper-text">
              {(formData.notes || '').length}/500 characters
            </div>
            {errors.notes && (
              <span className="form-error-text">{errors.notes}</span>
            )}
          </div>

          {/* Change Summary */}
          {hasChanges && (
            <div className="form-info-banner">
              You have made changes to {changedFields.size} field{changedFields.size !== 1 ? 's' : ''}.
            </div>
          )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFeeModal;

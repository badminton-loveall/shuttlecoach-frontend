import React, { useState, useMemo } from 'react';
import type { Student, FeeRecord } from '../types';
import './CreateFeeModal.css';

interface CreateFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feeData: CreateFeeFormData) => void;
  students: Student[];
  existingFees: FeeRecord[];
}

export interface CreateFeeFormData {
  studentId: string;
  amount: number;
  monthYear: string;
  dueDate: Date;
  notes?: string;
}

export const CreateFeeModal: React.FC<CreateFeeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  students,
  existingFees,
}) => {
  const [formData, setFormData] = useState<CreateFeeFormData>({
    studentId: '',
    amount: 0,
    monthYear: '',
    dueDate: new Date(),
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if fee already exists for selected student and month
  const feeExists = useMemo(() => {
    if (!formData.studentId || !formData.monthYear) return false;
    return existingFees.some(
      (fee) =>
        fee.studentId === formData.studentId &&
        fee.monthYear === formData.monthYear
    );
  }, [formData.studentId, formData.monthYear, existingFees]);

  // Get current date for default values
  const getCurrentMonthYear = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Get default due date (10th of the month)
  const getDefaultDueDate = (monthYear: string): Date => {
    if (!monthYear) return new Date();
    const [year, month] = monthYear.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 10);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Please select a student';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.amount > 999999.99) {
      newErrors.amount = 'Amount cannot exceed ₹999,999.99';
    }

    if (!formData.monthYear.trim()) {
      newErrors.monthYear = 'Please select a month/year';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Please select a due date';
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters';
    }

    if (feeExists) {
      newErrors.duplicate = 'Fee already exists for this student and month';
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
        studentId: '',
        amount: 0,
        monthYear: getCurrentMonthYear(),
        dueDate: getDefaultDueDate(getCurrentMonthYear()),
        notes: '',
      });
      setErrors({});
    } catch (error) {
      setErrors({ submit: 'Failed to create fee. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle student change
  const handleStudentChange = (studentId: string) => {
    setFormData({ ...formData, studentId });
    if (errors.studentId) {
      setErrors({ ...errors, studentId: '' });
    }
  };

  // Handle amount change
  const handleAmountChange = (amount: string) => {
    const numAmount = amount === '' ? 0 : parseFloat(amount);
    setFormData({ ...formData, amount: isNaN(numAmount) ? 0 : numAmount });
    if (errors.amount) {
      setErrors({ ...errors, amount: '' });
    }
  };

  // Handle month/year change
  const handleMonthYearChange = (monthYear: string) => {
    setFormData({
      ...formData,
      monthYear,
      dueDate: getDefaultDueDate(monthYear),
    });
    if (errors.monthYear) {
      setErrors({ ...errors, monthYear: '' });
    }
  };

  // Handle due date change
  const handleDueDateChange = (dateString: string) => {
    const date = new Date(dateString);
    setFormData({ ...formData, dueDate: date });
    if (errors.dueDate) {
      setErrors({ ...errors, dueDate: '' });
    }
  };

  // Handle notes change
  const handleNotesChange = (notes: string) => {
    setFormData({ ...formData, notes });
    if (errors.notes) {
      setErrors({ ...errors, notes: '' });
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData({
      studentId: '',
      amount: 0,
      monthYear: getCurrentMonthYear(),
      dueDate: getDefaultDueDate(getCurrentMonthYear()),
      notes: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Fee</h2>
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
          {/* Student Selection */}
          <div className="form-group">
            <label htmlFor="student" className="form-label">
              Student <span className="form-required">*</span>
            </label>
            <select
              id="student"
              value={formData.studentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className={`form-input form-select ${
                errors.studentId ? 'form-input-error' : ''
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName} ({student.baidNumber || 'No BAID'})
                </option>
              ))}
            </select>
            {errors.studentId && (
              <span className="form-error-text">{errors.studentId}</span>
            )}
          </div>

          {/* Amount */}
          <div className="form-group">
            <label htmlFor="amount" className="form-label">
              Amount (₹) <span className="form-required">*</span>
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

          {/* Month/Year */}
          <div className="form-group">
            <label htmlFor="monthYear" className="form-label">
              Month/Year <span className="form-required">*</span>
            </label>
            <input
              id="monthYear"
              type="month"
              value={formData.monthYear}
              onChange={(e) => handleMonthYearChange(e.target.value)}
              className={`form-input ${
                errors.monthYear ? 'form-input-error' : ''
              }`}
              disabled={isSubmitting}
            />
            {errors.monthYear && (
              <span className="form-error-text">{errors.monthYear}</span>
            )}
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label htmlFor="dueDate" className="form-label">
              Due Date <span className="form-required">*</span>
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
              Notes <span className="form-optional">(optional)</span>
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

          {/* Duplicate Warning */}
          {feeExists && (
            <div className="form-warning-banner">
              ⚠️ A fee already exists for {students.find((s) => s.id === formData.studentId)?.fullName} for {formData.monthYear}. Creating a new fee will result in duplicate fees.
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
              disabled={isSubmitting || feeExists}
            >
              {isSubmitting ? 'Creating...' : 'Create Fee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFeeModal;

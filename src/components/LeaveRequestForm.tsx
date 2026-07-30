import React, { useState } from 'react';
import type { LeaveType } from '../types';
import { useCreateLeaveRequest } from '../hooks/useLeaveRequests';
import type { CreateLeaveRequestData } from '../hooks/useLeaveRequests';

/**
 * LeaveRequestForm Component
 * Form for students to submit leave requests for future training sessions.
 * Requirements: 3.1, 3.2
 *
 * - Collects requested date, leave type, and optional reason
 * - Validates that requested date is in the future
 * - Uses useCreateLeaveRequest hook for submission
 */

interface LeaveRequestFormProps {
  studentId: string;
  batchId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  requestedDate: string;
  leaveType: LeaveType;
  reason: string;
}

interface FormErrors {
  [key: string]: string;
}

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'PLANNED_LEAVE', label: 'Planned Leave' },
  { value: 'SICK_LEAVE', label: 'Sick Leave' },
];

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
  studentId,
  batchId,
  onSuccess,
  onCancel,
}) => {
  const { createLeaveRequest, loading } = useCreateLeaveRequest();

  const [formData, setFormData] = useState<FormData>({
    requestedDate: '',
    leaveType: 'PLANNED_LEAVE',
    reason: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Get tomorrow's date as minimum date for leave requests
  const getTomorrowString = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.requestedDate) {
      newErrors.requestedDate = 'Date is required';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const requestedDate = new Date(formData.requestedDate);
      if (requestedDate <= today) {
        newErrors.requestedDate = 'Leave requests must be for a future date';
      }
    }

    if (!formData.leaveType) {
      newErrors.leaveType = 'Leave type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      const data: CreateLeaveRequestData = {
        studentId,
        batchId,
        requestedDate: formData.requestedDate,
        leaveType: formData.leaveType,
        reason: formData.reason || undefined,
      };

      await createLeaveRequest(data);

      setSuccessMessage('Leave request submitted successfully.');
      setFormData({
        requestedDate: '',
        leaveType: 'PLANNED_LEAVE',
        reason: '',
      });
      setErrors({});
      onSuccess?.();
    } catch {
      setErrors({
        submit: 'Failed to submit leave request. Please try again.',
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      requestedDate: '',
      leaveType: 'PLANNED_LEAVE',
      reason: '',
    });
    setErrors({});
    setSuccessMessage('');
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* Success message */}
      {successMessage && (
        <div
          className="rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </div>
      )}

      {/* General error banner */}
      {errors.submit && (
        <div
          className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          {errors.submit}
        </div>
      )}

      {/* Requested Date */}
      <div className="flex flex-col gap-1">
        <label htmlFor="leave-date" className="text-sm font-medium text-gray-700">
          Leave Date <span className="text-red-600">*</span>
        </label>
        <input
          id="leave-date"
          type="date"
          value={formData.requestedDate}
          min={getTomorrowString()}
          onChange={(e) => {
            setFormData({ ...formData, requestedDate: e.target.value });
            if (errors.requestedDate) setErrors({ ...errors, requestedDate: '' });
          }}
          disabled={loading}
          aria-required="true"
          aria-invalid={!!errors.requestedDate}
          aria-describedby={errors.requestedDate ? 'leave-date-error' : undefined}
          className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 transition-all ${
            errors.requestedDate
              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          style={errors.requestedDate ? undefined : { border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-card)' }}
        />
        {errors.requestedDate && (
          <span id="leave-date-error" className="text-xs text-red-600" role="alert">
            {errors.requestedDate}
          </span>
        )}
      </div>

      {/* Leave Type */}
      <div className="flex flex-col gap-1">
        <label htmlFor="leave-type" className="text-sm font-medium text-gray-700">
          Leave Type <span className="text-red-600">*</span>
        </label>
        <select
          id="leave-type"
          value={formData.leaveType}
          onChange={(e) => {
            setFormData({ ...formData, leaveType: e.target.value as LeaveType });
            if (errors.leaveType) setErrors({ ...errors, leaveType: '' });
          }}
          disabled={loading}
          aria-required="true"
          aria-invalid={!!errors.leaveType}
          aria-describedby={errors.leaveType ? 'leave-type-error' : undefined}
          className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 transition-all ${
            errors.leaveType
              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          style={errors.leaveType ? undefined : { border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-card)' }}
        >
          {LEAVE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.leaveType && (
          <span id="leave-type-error" className="text-xs text-red-600" role="alert">
            {errors.leaveType}
          </span>
        )}
      </div>

      {/* Reason (optional) */}
      <div className="flex flex-col gap-1">
        <label htmlFor="leave-reason" className="text-sm font-medium text-gray-700">
          Reason <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="leave-reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="e.g., Family function, medical appointment..."
          disabled={loading}
          rows={3}
          className={`w-full rounded-md px-3 py-2 text-sm text-gray-900 transition-all resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
            loading ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-card)' }}
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-card)' }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </div>
    </form>
  );
};

export default LeaveRequestForm;

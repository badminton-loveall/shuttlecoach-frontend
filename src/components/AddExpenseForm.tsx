import React, { useState } from 'react';
import type { Expense, ExpenseType } from '../types';

interface AddExpenseFormProps {
  coachId: string;
  onSubmit: (
    expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => Promise<void>;
  isLoading?: boolean;
  isEditing?: boolean;
  initialExpense?: Expense;
  onCancel?: () => void;
}

interface FormData {
  type: ExpenseType;
  amount: number;
  date: string;
  description: string;
}

interface FormErrors {
  [key: string]: string;
}

const EXPENSE_TYPES: ExpenseType[] = ['SHUTTLE', 'SUPPLIES', 'TRAVEL', 'OTHER'];

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  coachId,
  onSubmit,
  isLoading = false,
  isEditing = false,
  initialExpense,
  onCancel,
}) => {
  // Get today's date in YYYY-MM-DD format
  const getTodayString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Convert Date to YYYY-MM-DD string
  const dateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<FormData>({
    type: initialExpense?.type || 'SHUTTLE',
    amount: initialExpense?.amount || 0,
    date: initialExpense ? dateToString(initialExpense.date) : getTodayString(),
    description: initialExpense?.description || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate type
    if (!formData.type) {
      newErrors.type = 'Expense type is required';
    }

    // Validate amount > 0
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    // Validate date <= today
    if (formData.date > getTodayString()) {
      newErrors.date = 'Date cannot be in the future';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    // Validate description not empty
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
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
      // Parse date string to Date object
      const dateObj = new Date(formData.date);

      const expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> =
        {
          coachId,
          type: formData.type,
          amount: formData.amount,
          date: dateObj,
          description: formData.description,
        };

      await onSubmit(expenseData);

      // Clear form on success
      setFormData({
        type: 'SHUTTLE',
        amount: 0,
        date: getTodayString(),
        description: '',
      });
      setErrors({});
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to create expense. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      type: initialExpense?.type || 'SHUTTLE',
      amount: initialExpense?.amount || 0,
      date: initialExpense ? dateToString(initialExpense.date) : getTodayString(),
      description: initialExpense?.description || '',
    });
    setErrors({});
    onCancel?.();
  };

  // Handle field changes with validation clearing
  const handleTypeChange = (value: string) => {
    setFormData({ ...formData, type: value as ExpenseType });
    if (errors.type) {
      setErrors({ ...errors, type: '' });
    }
  };

  const handleAmountChange = (value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setFormData({
      ...formData,
      amount: isNaN(numValue) ? 0 : numValue,
    });
    if (errors.amount) {
      setErrors({ ...errors, amount: '' });
    }
  };

  const handleDateChange = (value: string) => {
    setFormData({ ...formData, date: value });
    if (errors.date) {
      setErrors({ ...errors, date: '' });
    }
  };

  const handleDescriptionChange = (value: string) => {
    setFormData({ ...formData, description: value });
    if (errors.description) {
      setErrors({ ...errors, description: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* General error banner */}
      {errors.submit && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {errors.submit}
        </div>
      )}

      {/* Expense Type Dropdown */}
      <div className="flex flex-col gap-2">
        <label htmlFor="expense-type" className="text-sm font-medium text-gray-700">
          Expense Type <span className="text-red-600">*</span>
        </label>
        <select
          id="expense-type"
          value={formData.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          disabled={isSubmitting || isLoading}
          className={`w-full rounded-md border px-3 py-2 text-sm font-normal text-gray-900 transition-all ${
            errors.type
              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          } ${isSubmitting || isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {EXPENSE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        {errors.type && (
          <span className="text-xs text-red-600">{errors.type}</span>
        )}
      </div>

      {/* Amount Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="expense-amount" className="text-sm font-medium text-gray-700">
          Amount <span className="text-red-600">*</span>
        </label>
        <input
          id="expense-amount"
          type="number"
          min="0"
          step="0.01"
          value={formData.amount || ''}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0.00"
          disabled={isSubmitting || isLoading}
          className={`w-full rounded-md border px-3 py-2 text-sm font-normal text-gray-900 transition-all ${
            errors.amount
              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          } ${isSubmitting || isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
        {errors.amount && (
          <span className="text-xs text-red-600">{errors.amount}</span>
        )}
      </div>

      {/* Date Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="expense-date" className="text-sm font-medium text-gray-700">
          Date <span className="text-red-600">*</span>
        </label>
        <input
          id="expense-date"
          type="date"
          value={formData.date}
          onChange={(e) => handleDateChange(e.target.value)}
          max={getTodayString()}
          disabled={isSubmitting || isLoading}
          className={`w-full rounded-md border px-3 py-2 text-sm font-normal text-gray-900 transition-all ${
            errors.date
              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          } ${isSubmitting || isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
        {errors.date && (
          <span className="text-xs text-red-600">{errors.date}</span>
        )}
      </div>

      {/* Description Textarea */}
      <div className="flex flex-col gap-2">
        <label htmlFor="expense-description" className="text-sm font-medium text-gray-700">
          Description <span className="text-red-600">*</span>
        </label>
        <textarea
          id="expense-description"
          value={formData.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="e.g., Shuttle service for training session"
          disabled={isSubmitting || isLoading}
          rows={3}
          className={`w-full rounded-md border px-3 py-2 text-sm font-normal text-gray-900 transition-all resize-none ${
            errors.description
              ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          } ${isSubmitting || isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
        {errors.description && (
          <span className="text-xs text-red-600">{errors.description}</span>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting || isLoading}
          className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting || isLoading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Expense' : 'Save Expense')}
        </button>
      </div>
    </form>
  );
};

export default AddExpenseForm;

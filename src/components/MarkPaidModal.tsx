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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mark Fee as Paid</h2>
            {studentName && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Student: {studentName}
              </p>
            )}
            {feeAmount !== undefined && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Amount: {formatCurrency(feeAmount)}
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {/* Payment Method */}
              <div>
                <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                      paymentMethod === 'CASH'
                        ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                      paymentMethod === 'UPI'
                        ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors text-sm ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Bank
                  </button>
                </div>
              </div>

              {/* Paid Date */}
              <div>
                <label htmlFor="paid-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paid Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="paid-date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Transaction Reference */}
              <div>
                <label htmlFor="transaction-ref" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction Reference
                  <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="transaction-ref"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g., UPI ID, Check number, Transfer ID"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                  <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about this payment"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !paidDate}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-gray-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Mark as Paid'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default MarkPaidModal;

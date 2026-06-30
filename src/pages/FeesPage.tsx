import React, { useState, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import FeeListTable from '../components/FeeListTable';
import MarkPaidModal, { type PaymentFormData } from '../components/MarkPaidModal';
import { computeAllFeeStatuses } from '../utils/feeUtils';
import type { FeeRecord, Student, FeeStatus } from '../types';
import feesData from '../data/fees.json';
import studentsData from '../data/students.json';

/**
 * FeesPage
 * Fee management dashboard for Head Coach and Assistant Coach
 * Displays fee statistics and list of all fee records with filtering and sorting
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

export const FeesPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | FeeStatus>('all');
  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [localFees, setLocalFees] = useState<FeeRecord[]>([]);

  // Load and compute fee statuses (auto-detect overdue)
  const fees = useMemo(() => {
    // Convert date strings to Date objects
    const parsedFees: FeeRecord[] = (feesData as unknown as FeeRecord[]).map((fee) => ({
      ...fee,
      dueDate: new Date(fee.dueDate),
      paidDate: fee.paidDate ? new Date(fee.paidDate) : undefined,
      createdAt: new Date(fee.createdAt),
      updatedAt: new Date(fee.updatedAt),
    }));
    
    // Use local fees if available, otherwise use parsed fees from JSON
    const currentFees = localFees.length > 0 ? localFees : parsedFees;
    return computeAllFeeStatuses(currentFees);
  }, [localFees]);

  const students = useMemo(() => {
    // Convert date strings to Date objects
    return (studentsData as unknown as Student[]).map((student) => ({
      ...student,
      dateOfBirth: new Date(student.dateOfBirth),
      createdAt: new Date(student.createdAt),
      updatedAt: new Date(student.updatedAt),
    }));
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Total collected this month (sum of PAID fees with paidDate in current month)
    const totalCollectedThisMonth = fees
      .filter((fee) => {
        if (fee.status !== 'PAID' || !fee.paidDate) return false;
        const paidDate = new Date(fee.paidDate);
        return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
      })
      .reduce((sum, fee) => sum + fee.amount, 0);

    // Outstanding balance (sum of PENDING + OVERDUE)
    const outstandingBalance = fees
      .filter((fee) => fee.status === 'PENDING' || fee.status === 'OVERDUE')
      .reduce((sum, fee) => sum + fee.amount, 0);

    // Overdue count
    const overdueCount = fees.filter((fee) => fee.status === 'OVERDUE').length;

    return {
      totalCollectedThisMonth,
      outstandingBalance,
      overdueCount,
    };
  }, [fees]);

  // Filter and sort fees
  const filteredAndSortedFees = useMemo(() => {
    let filtered = fees;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = fees.filter((fee) => fee.status === statusFilter);
    }

    // Sort by due date (earliest first)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    });

    return sorted;
  }, [fees, statusFilter]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Stat card color classes based on urgency
  const getStatCardClasses = (type: 'collected' | 'outstanding' | 'overdue'): string => {
    switch (type) {
      case 'collected':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'outstanding':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'overdue':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getStatValueClasses = (type: 'collected' | 'outstanding' | 'overdue'): string => {
    switch (type) {
      case 'collected':
        return 'text-green-700 dark:text-green-300';
      case 'outstanding':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'overdue':
        return 'text-red-700 dark:text-red-300';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  const getStatLabelClasses = (type: 'collected' | 'outstanding' | 'overdue'): string => {
    switch (type) {
      case 'collected':
        return 'text-green-600 dark:text-green-400';
      case 'outstanding':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'overdue':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Handler for opening mark paid modal
  const handleMarkPaidClick = (feeId: string) => {
    setSelectedFeeId(feeId);
    setIsMarkPaidModalOpen(true);
  };

  // Handler for closing mark paid modal
  const handleCloseMarkPaidModal = () => {
    setIsMarkPaidModalOpen(false);
    setSelectedFeeId(null);
  };

  // Handler for submitting payment
  const handleMarkPaidSubmit = (paymentData: PaymentFormData) => {
    if (!selectedFeeId) return;

    // Find the fee to update
    const feeIndex = fees.findIndex((fee) => fee.id === selectedFeeId);
    if (feeIndex === -1) return;

    // Create updated fee record
    const updatedFee: FeeRecord = {
      ...fees[feeIndex],
      status: 'PAID',
      paidDate: new Date(paymentData.paidDate),
      paymentMethod: paymentData.paymentMethod,
      transactionRef: paymentData.transactionRef,
      notes: paymentData.notes,
      updatedAt: new Date(),
    };

    // Update local state with the new fee data
    const updatedFees = [...fees];
    updatedFees[feeIndex] = updatedFee;
    setLocalFees(updatedFees);

    // Close modal
    handleCloseMarkPaidModal();
  };

  // Get selected fee details for modal
  const selectedFee = selectedFeeId ? fees.find((fee) => fee.id === selectedFeeId) : null;
  const selectedStudent = selectedFee
    ? students.find((student) => student.id === selectedFee.studentId)
    : null;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fee Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track and manage student fee payments
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Collected This Month */}
          <div
            className={`p-6 rounded-lg border-2 ${getStatCardClasses('collected')}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${getStatLabelClasses('collected')}`}>
                  Collected This Month
                </p>
                <p className={`text-3xl font-bold mt-2 ${getStatValueClasses('collected')}`}>
                  {formatCurrency(stats.totalCollectedThisMonth)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Outstanding Balance */}
          <div
            className={`p-6 rounded-lg border-2 ${getStatCardClasses('outstanding')}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${getStatLabelClasses('outstanding')}`}>
                  Outstanding Balance
                </p>
                <p className={`text-3xl font-bold mt-2 ${getStatValueClasses('outstanding')}`}>
                  {formatCurrency(stats.outstandingBalance)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-800 rounded-full">
                <svg
                  className="w-8 h-8 text-yellow-600 dark:text-yellow-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Overdue Count */}
          <div
            className={`p-6 rounded-lg border-2 ${getStatCardClasses('overdue')}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${getStatLabelClasses('overdue')}`}>
                  Overdue Fees
                </p>
                <p className={`text-3xl font-bold mt-2 ${getStatValueClasses('overdue')}`}>
                  {stats.overdueCount}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-800 rounded-full">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | FeeStatus)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
            <option value="WAIVED">Waived</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredAndSortedFees.length} of {fees.length} fees
          </span>
        </div>

        {/* Fee List Table */}
        <FeeListTable
          fees={filteredAndSortedFees}
          students={students}
          onMarkPaid={handleMarkPaidClick}
        />

        {/* Mark Paid Modal */}
        <MarkPaidModal
          isOpen={isMarkPaidModalOpen}
          onClose={handleCloseMarkPaidModal}
          onSubmit={handleMarkPaidSubmit}
          studentName={selectedStudent?.fullName}
          feeAmount={selectedFee?.amount}
        />
      </div>
    </DashboardLayout>
  );
};

export default FeesPage;

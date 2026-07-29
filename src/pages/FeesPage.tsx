import React, { useState, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import FeeListTable from '../components/FeeListTable';
import MarkPaidModal, { type PaymentFormData } from '../components/MarkPaidModal';
import WaiveFeeModal from '../components/WaiveFeeModal';
import CreateFeeModal, { type CreateFeeFormData } from '../components/CreateFeeModal';
import EditFeeModal, { type EditFeeFormData } from '../components/EditFeeModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import StatCard from '../components/StatCard';
import CollapsibleFilterPanel from '../components/CollapsibleFilterPanel';
import { computeAllFeeStatuses } from '../utils/feeUtils';
import { useFees } from '../hooks/useFees';
import { useStudents } from '../hooks/useStudents';
import apiClient from '../utils/apiClient';
import type { FeeStatus } from '../types';

/**
 * FeesPage
 * Fee management dashboard for Head Coach and Assistant Coach
 * Displays fee statistics and list of all fee records with filtering and sorting
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 13.1, 13.2, 13.3, 13.4, 13.5
 */

export const FeesPage: React.FC = () => {
  const { fees: rawFees, loading: feesLoading, error: feesError, createFee, markFeeAsPaid, waiveFee, refetch: refetchFees } = useFees();
  const { students, loading: studentsLoading } = useStudents();

  const [selectedStatuses, setSelectedStatuses] = useState<FeeStatus[]>(['PAID', 'PENDING', 'OVERDUE', 'WAIVED']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [isCreateFeeModalOpen, setIsCreateFeeModalOpen] = useState(false);
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
  const [isWaiveFeeModalOpen, setIsWaiveFeeModalOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);

  const loading = feesLoading || studentsLoading;

  // Compute fee statuses (auto-detect overdue)
  const fees = useMemo(() => computeAllFeeStatuses(rawFees), [rawFees]);

  // Get unique months from fees (sorted descending - newest first)
  const uniqueMonths = useMemo(() => {
    const months = new Set(fees.map((fee) => fee.monthYear));
    return Array.from(months).sort().reverse();
  }, [fees]);

  // Get unique batches from students (sorted alphabetically)
  const uniqueBatches = useMemo(() => {
    const batchMap = new Map<string, string>();
    students.forEach((student) => {
      if (student.batchId && !batchMap.has(student.batchId)) {
        batchMap.set(student.batchId, `Batch ${student.batchId.split('-')[1]}`);
      }
    });
    return Array.from(batchMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([id, name]) => ({ id, name }));
  }, [students]);

  // Calculate statistics
  const stats = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const totalCollectedThisMonth = fees
      .filter((fee) => {
        if (fee.status !== 'PAID' || !fee.paidDate) return false;
        const paidDate = new Date(fee.paidDate);
        return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
      })
      .reduce((sum, fee) => sum + fee.amount, 0);

    const outstandingBalance = fees
      .filter((fee) => fee.status === 'PENDING' || fee.status === 'OVERDUE')
      .reduce((sum, fee) => sum + fee.amount, 0);

    const overdueCount = fees.filter((fee) => fee.status === 'OVERDUE').length;

    return { totalCollectedThisMonth, outstandingBalance, overdueCount };
  }, [fees]);

  // Filter and sort fees
  const filteredAndSortedFees = useMemo(() => {
    let filtered = fees.filter((fee) => selectedStatuses.includes(fee.status));

    if (selectedMonth !== '') {
      filtered = filtered.filter((fee) => fee.monthYear === selectedMonth);
    }

    if (selectedBatch !== '') {
      filtered = filtered.filter((fee) => {
        const student = students.find((s) => s.id === fee.studentId);
        return student && student.batchId === selectedBatch;
      });
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((fee) => {
        const student = students.find((s) => s.id === fee.studentId);
        const studentName = student?.fullName.toLowerCase() || '';
        const studentId = student?.id.toLowerCase() || '';
        const monthYear = fee.monthYear.toLowerCase();
        return studentName.includes(query) || studentId.includes(query) || monthYear.includes(query);
      });
    }

    return [...filtered].sort((a, b) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [fees, selectedStatuses, selectedMonth, selectedBatch, searchQuery, students]);

  // Format currency
  const formatCurrency = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

  // Handle status filter toggle
  const handleStatusToggle = (status: FeeStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // Handler for creating new fee
  const handleCreateFeeSubmit = async (feeData: CreateFeeFormData) => {
    await createFee({
      studentId: feeData.studentId,
      amount: feeData.amount,
      monthYear: feeData.monthYear,
      dueDate: feeData.dueDate.toISOString(),
      notes: feeData.notes,
    });
    setIsCreateFeeModalOpen(false);
  };

  // Handler for opening mark paid modal
  const handleMarkPaidClick = (feeId: string) => {
    setSelectedFeeId(feeId);
    setIsMarkPaidModalOpen(true);
  };

  const handleCloseMarkPaidModal = () => {
    setIsMarkPaidModalOpen(false);
    setSelectedFeeId(null);
  };

  // Handler for submitting payment
  const handleMarkPaidSubmit = async (paymentData: PaymentFormData) => {
    if (!selectedFeeId) return;
    await markFeeAsPaid(selectedFeeId, {
      paidDate: paymentData.paidDate,
      paymentMethod: paymentData.paymentMethod,
      transactionRef: paymentData.transactionRef,
      notes: paymentData.notes,
    });
    handleCloseMarkPaidModal();
  };

  // Handler for opening waive fee modal
  const handleWaiveFeeClick = (feeId: string) => {
    setSelectedFeeId(feeId);
    setIsWaiveFeeModalOpen(true);
  };

  const handleCloseWaiveFeeModal = () => {
    setIsWaiveFeeModalOpen(false);
    setSelectedFeeId(null);
  };

  // Handler for submitting fee waiver
  const handleWaiveFeeSubmit = async (reason: string) => {
    if (!selectedFeeId) return;
    await waiveFee(selectedFeeId, { reason });
    handleCloseWaiveFeeModal();
  };

  // Handler for opening edit fee modal
  const handleEditFeeClick = (feeId: string) => {
    setSelectedFeeId(feeId);
    setIsEditFeeModalOpen(true);
  };

  const handleCloseEditFeeModal = () => {
    setIsEditFeeModalOpen(false);
    setSelectedFeeId(null);
  };

  // Handler for submitting edit fee
  const handleEditFeeSubmit = async (feeData: EditFeeFormData) => {
    await apiClient.patch(`/fees/${feeData.feeId}`, {
      amount: feeData.amount,
      dueDate: feeData.dueDate instanceof Date ? feeData.dueDate.toISOString() : feeData.dueDate,
      notes: feeData.notes,
    });
    await refetchFees();
    handleCloseEditFeeModal();
  };

  // Handler for opening delete confirmation dialog
  const handleDeleteFeeClick = (feeId: string) => {
    setSelectedFeeId(feeId);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedFeeId(null);
  };

  // Handler for confirming fee deletion
  const handleDeleteFeeConfirm = async () => {
    if (!selectedFeeId) return;
    await apiClient.delete(`/fees/${selectedFeeId}`);
    await refetchFees();
    handleCloseDeleteDialog();
  };

  // Get selected fee details for modal
  const selectedFee = selectedFeeId ? fees.find((fee) => fee.id === selectedFeeId) ?? null : null;
  const selectedStudent = selectedFee
    ? students.find((student) => student.id === selectedFee.studentId) ?? null
    : null;

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Fee Management</h1>
              <p className="page-header-subtitle">Track and manage student fee payments</p>
            </div>
            <div className="page-header-actions">
              <CollapsibleFilterPanel activeFilterCount={selectedStatuses.length - 4 + (selectedMonth ? 1 : 0) + (selectedBatch ? 1 : 0) + (searchQuery ? 1 : 0)}>
                <div className="filter-panel-inner">
                  <div className="filter-panel-search">
                    <input type="text" placeholder="Search by name, student ID, or batch..." className="filter-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>

                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="filter-dropdown" title="Filter by month">
                    <option value="">All Months</option>
                    {uniqueMonths.map((month) => (<option key={month} value={month}>{month}</option>))}
                  </select>

                  <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="filter-dropdown" title="Filter by batch">
                    <option value="">All Batches</option>
                    {uniqueBatches.map((batch) => (<option key={batch.id} value={batch.id}>{batch.name}</option>))}
                  </select>

                  <div className="filter-section-divider">
                    <h4 className="filter-section-title">Status</h4>
                  </div>

                  <div className="filter-status-row">
                    <button onClick={() => handleStatusToggle('PAID')} className={`filter-status-badge filter-badge--paid ${selectedStatuses.includes('PAID') ? 'active' : ''}`} title="Paid fees">Paid</button>
                    <button onClick={() => handleStatusToggle('PENDING')} className={`filter-status-badge filter-badge--pending ${selectedStatuses.includes('PENDING') ? 'active' : ''}`} title="Pending fees">Pending</button>
                    <button onClick={() => handleStatusToggle('OVERDUE')} className={`filter-status-badge filter-badge--overdue ${selectedStatuses.includes('OVERDUE') ? 'active' : ''}`} title="Overdue fees">Overdue</button>
                    <button onClick={() => handleStatusToggle('WAIVED')} className={`filter-status-badge filter-badge--waived ${selectedStatuses.includes('WAIVED') ? 'active' : ''}`} title="Waived fees">Waived</button>
                  </div>

                  <div className="filter-results">
                    <span className="filter-count">{filteredAndSortedFees.length} of {fees.length} records</span>
                  </div>
                </div>
              </CollapsibleFilterPanel>
              <button
                onClick={() => setIsCreateFeeModalOpen(true)}
                className="btn-create-fee"
                title="Create new fee"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create Fee
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="card" style={{ padding: 'var(--space-xl)' }}>
              <div className="animate-pulse flex flex-col" style={{ gap: 'var(--space-md)' }}>
                <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--border-default)' }}></div>
                <div className="h-4 rounded" style={{ backgroundColor: 'var(--border-default)' }}></div>
                <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--border-default)' }}></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {feesError && (
            <div className="p-md" style={{ backgroundColor: 'var(--feedback-danger-light)', border: '1px solid var(--color-danger-light)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
              <p className="text-small" style={{ color: 'var(--color-danger-text)' }}>{feesError}</p>
            </div>
          )}

          {/* Statistics Cards */}
          {!loading && (
            <div className="hc-stats-grid">
              <StatCard
                title="Collected This Month"
                value={formatCurrency(stats.totalCollectedThisMonth)}
                label="This month"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                variant="success"
              />
              <StatCard
                title="Outstanding Balance"
                value={formatCurrency(stats.outstandingBalance)}
                label="Pending payments"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                variant="warning"
              />
              <StatCard
                title="Overdue Fees"
                value={stats.overdueCount}
                label="Need attention"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
                variant="danger"
              />
            </div>
          )}

          {/* Table Section */}
          {!loading && (
            <div className="hc-overview">
              <div className="table-filter-section">
                <FeeListTable
                  fees={filteredAndSortedFees}
                  students={students}
                  onMarkPaid={handleMarkPaidClick}
                  onWaive={handleWaiveFeeClick}
                  onEdit={handleEditFeeClick}
                  onDelete={handleDeleteFeeClick}
                />
              </div>
            </div>
          )}

          {/* Mark Paid Modal */}
          <MarkPaidModal
            isOpen={isMarkPaidModalOpen}
            onClose={handleCloseMarkPaidModal}
            onSubmit={handleMarkPaidSubmit}
            studentName={selectedStudent?.fullName}
            feeAmount={selectedFee?.amount}
          />

          {/* Waive Fee Modal */}
          <WaiveFeeModal
            isOpen={isWaiveFeeModalOpen}
            onClose={handleCloseWaiveFeeModal}
            onSubmit={handleWaiveFeeSubmit}
            studentName={selectedStudent?.fullName}
            feeAmount={selectedFee?.amount}
          />

          {/* Create Fee Modal */}
          <CreateFeeModal
            isOpen={isCreateFeeModalOpen}
            onClose={() => setIsCreateFeeModalOpen(false)}
            onSubmit={handleCreateFeeSubmit}
            students={students}
            existingFees={fees}
          />

          {/* Edit Fee Modal */}
          <EditFeeModal
            isOpen={isEditFeeModalOpen}
            onClose={handleCloseEditFeeModal}
            onSubmit={handleEditFeeSubmit}
            fee={selectedFee}
            student={selectedStudent}
          />

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={handleCloseDeleteDialog}
            onConfirm={handleDeleteFeeConfirm}
            fee={selectedFee}
            student={selectedStudent}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FeesPage;

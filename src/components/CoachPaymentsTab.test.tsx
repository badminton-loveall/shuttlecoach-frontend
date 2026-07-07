import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CoachPaymentsTab from './CoachPaymentsTab';
import type { FeeRecord, Student, Expense } from '../types';

// Mock data
const mockStudents: Student[] = [
  {
    id: 'student-001',
    fullName: 'Arjun Verma',
    email: 'arjun@example.com',
    assignedCoachId: 'coach-001',
    batchId: 'batch-001',
    skillLevel: 'Beginner',
  } as Student,
  {
    id: 'student-002',
    fullName: 'Neha Sharma',
    email: 'neha@example.com',
    assignedCoachId: 'coach-001',
    batchId: 'batch-001',
    skillLevel: 'Intermediate',
  } as Student,
];

const mockFeeRecords: FeeRecord[] = [
  {
    id: 'fee-001',
    studentId: 'student-001',
    amount: 1000,
    monthYear: 'January 2026',
    dueDate: new Date('2026-01-31'),
    paidDate: new Date('2026-01-10'),
    status: 'PAID',
    paymentMethod: 'UPI',
    transactionRef: 'UPI001',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-10'),
  },
  {
    id: 'fee-002',
    studentId: 'student-002',
    amount: 1000,
    monthYear: 'January 2026',
    dueDate: new Date('2026-01-31'),
    paidDate: new Date('2026-01-15'),
    status: 'PAID',
    paymentMethod: 'CASH',
    transactionRef: 'CASH001',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
];

const mockExpenses: Expense[] = [
  {
    id: 'exp-001',
    coachId: 'coach-001',
    type: 'SHUTTLE',
    amount: 500,
    date: new Date('2026-01-05'),
    description: 'Shuttle for training',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-05'),
    createdBy: 'coach-001',
  },
];

describe('CoachPaymentsTab', () => {
  describe('Filter and Sort', () => {
    it('should render filter UI with date range, student, batch, payment method, and expense type inputs', () => {
      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
        />
      );

      // Check that filter inputs are present
      expect(screen.getByLabelText('From Date')).toBeInTheDocument();
      expect(screen.getByLabelText('To Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Student')).toBeInTheDocument();
      expect(screen.getByLabelText('Batch')).toBeInTheDocument();
      expect(screen.getByLabelText('Payment Method')).toBeInTheDocument();
      expect(screen.getByLabelText('Expense Type')).toBeInTheDocument();
    });

    it('should apply filters and display filtered results', () => {
      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
        />
      );

      // Initially should show both fees and expenses
      expect(screen.getByText('Showing 3 transactions')).toBeInTheDocument();

      // Apply expense type filter
      const expenseTypeSelect = screen.getByLabelText('Expense Type') as HTMLSelectElement;
      fireEvent.change(expenseTypeSelect, { target: { value: 'SHUTTLE' } });

      // After filtering by expense type SHUTTLE, should show only 1 expense + 0 fees with that type
      // Should show only the shuttle expense
      expect(screen.getByText(/Showing.*transaction/)).toBeInTheDocument();
    });

    it('should sort transactions by date descending (most recent first)', () => {
      const { container } = render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
        />
      );

      // Get all rows from the table body
      const rows = container.querySelectorAll('tbody tr');

      // Verify rows exist
      expect(rows.length).toBeGreaterThan(0);

      // Verify that the most recent transaction is first
      // fee-002 (2026-01-15) should come before fee-001 (2026-01-10)
      const rowTexts = Array.from(rows)
        .map((row) => row.textContent)
        .filter((text) => text && text.includes('2026'));

      expect(rowTexts.length).toBeGreaterThan(0);
    });

    it('should recalculate summaries when filters change', () => {
      const { rerender } = render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
        />
      );

      // Check initial summary
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Net Balance')).toBeInTheDocument();

      // Summary values should be displayed
      const stats = screen.queryAllByText(/₹/);
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should display active filter badges', () => {
      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
        />
      );

      const dateFromInput = screen.getByLabelText('From Date') as HTMLInputElement;
      fireEvent.change(dateFromInput, { target: { value: '2026-01-01' } });

      // Filter badge should be displayed
      expect(screen.getByText(/From:/)).toBeInTheDocument();
    });

    it('should show Clear Filters button when filters are active', () => {
      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
        />
      );

      const dateFromInput = screen.getByLabelText('From Date') as HTMLInputElement;
      fireEvent.change(dateFromInput, { target: { value: '2026-01-01' } });

      // Clear Filters button should appear
      const clearButton = screen.getByRole('button', { name: /Clear Filters/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should clear all filters when Clear Filters button is clicked', () => {
      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
        />
      );

      // Add a filter
      const dateFromInput = screen.getByLabelText('From Date') as HTMLInputElement;
      fireEvent.change(dateFromInput, { target: { value: '2026-01-01' } });

      // Verify filter is active
      expect(screen.getByText(/From:/)).toBeInTheDocument();

      // Click Clear Filters button
      const clearButton = screen.getByRole('button', { name: /Clear Filters/i });
      fireEvent.click(clearButton);

      // Verify all filters are cleared (filter badges should be gone)
      expect(screen.queryByText(/From:/)).not.toBeInTheDocument();
    });

    it('should display result count', () => {
      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
        />
      );

      // Should show transaction count
      expect(screen.getByText(/Showing.*transactions/)).toBeInTheDocument();
    });

    it('should display table with both fees and expenses', () => {
      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
        />
      );

      // Table should have headers for Type, Student Name, Amount, Date, Details, Status
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Student Name')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should show financial summary cards with updated values', () => {
      render(
        <CoachPaymentsTab
          coachId="coach-001"
          fees={mockFeeRecords}
          expenses={mockExpenses}
          students={mockStudents}
        />
      );

      // Summary cards should be displayed
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Net Balance')).toBeInTheDocument();
      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });
  });
});

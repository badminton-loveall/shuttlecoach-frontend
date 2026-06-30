import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeeListTable } from './FeeListTable';
import type { FeeRecord, Student } from '../types';

describe('FeeListTable', () => {
  const mockStudents: Student[] = [
    {
      id: 'student-001',
      fullName: 'John Doe',
      dateOfBirth: new Date('2010-01-01'),
      age: 14,
      gender: 'Male',
      contactPhone: '1234567890',
      batchId: 'batch-001',
      strengths: [],
      weaknesses: [],
      skillLevel: 'Beginner',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'student-002',
      fullName: 'Jane Smith',
      dateOfBirth: new Date('2011-01-01'),
      age: 13,
      gender: 'Female',
      contactPhone: '0987654321',
      batchId: 'batch-002',
      strengths: [],
      weaknesses: [],
      skillLevel: 'Intermediate',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockFees: FeeRecord[] = [
    {
      id: 'fee-001',
      studentId: 'student-001',
      amount: 3000,
      monthYear: '2026-01',
      dueDate: new Date('2026-01-10'),
      status: 'PAID',
      paidDate: new Date('2026-01-08'),
      paymentMethod: 'UPI',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'fee-002',
      studentId: 'student-002',
      amount: 3500,
      monthYear: '2026-02',
      dueDate: new Date('2026-02-10'),
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'fee-003',
      studentId: 'student-001',
      amount: 3000,
      monthYear: '2025-12',
      dueDate: new Date('2025-12-10'),
      status: 'OVERDUE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders fee table with correct data', () => {
    render(<FeeListTable fees={mockFees} students={mockStudents} />);

    // Check table headers
    expect(screen.getByText('Student Name')).toBeInTheDocument();
    expect(screen.getByText('Month/Year')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Due Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Check student names (use getAllByText since John Doe appears twice)
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Check amounts (use getAllByText since ₹3,000 appears twice)
    expect(screen.getAllByText('₹3,000').length).toBeGreaterThan(0);
    expect(screen.getByText('₹3,500')).toBeInTheDocument();
  });

  it('displays status badges with correct colors', () => {
    render(<FeeListTable fees={mockFees} students={mockStudents} />);

    // Check for status badges
    const paidBadge = screen.getByText('PAID');
    const pendingBadge = screen.getByText('PENDING');
    const overdueBadge = screen.getByText('OVERDUE');

    expect(paidBadge).toBeInTheDocument();
    expect(pendingBadge).toBeInTheDocument();
    expect(overdueBadge).toBeInTheDocument();

    // Check badge colors (class names)
    expect(paidBadge.className).toContain('bg-green-100');
    expect(pendingBadge.className).toContain('bg-yellow-100');
    expect(overdueBadge.className).toContain('bg-red-100');
  });

  it('shows action buttons for pending and overdue fees', () => {
    const mockMarkPaid = vi.fn();
    const mockWaive = vi.fn();

    render(
      <FeeListTable
        fees={mockFees}
        students={mockStudents}
        onMarkPaid={mockMarkPaid}
        onWaive={mockWaive}
      />
    );

    // Check for action buttons (should have 2 sets: PENDING + OVERDUE)
    const markPaidButtons = screen.getAllByText('Mark Paid');
    const waiveButtons = screen.getAllByText('Waive');

    expect(markPaidButtons).toHaveLength(2);
    expect(waiveButtons).toHaveLength(2);
  });

  it('displays paid date for paid fees', () => {
    render(<FeeListTable fees={mockFees} students={mockStudents} />);

    // Check for paid date text
    expect(screen.getByText(/Paid on/i)).toBeInTheDocument();
  });

  it('displays empty state when no fees', () => {
    render(<FeeListTable fees={[]} students={mockStudents} />);

    expect(screen.getByText('No fee records found')).toBeInTheDocument();
  });

  it('sorts fees by due date', () => {
    render(<FeeListTable fees={mockFees} students={mockStudents} />);

    // Get all month/year cells
    const monthYearCells = screen.getAllByText(/202[56]-\d{2}/);

    // The fees should be displayed in due date order (earliest first)
    // fee-003: 2025-12-10 (overdue), fee-001: 2026-01-10 (paid), fee-002: 2026-02-10 (pending)
    expect(monthYearCells[0]).toHaveTextContent('2025-12');
    expect(monthYearCells[1]).toHaveTextContent('2026-01');
    expect(monthYearCells[2]).toHaveTextContent('2026-02');
  });
});

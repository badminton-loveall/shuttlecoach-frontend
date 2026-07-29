/**
 * Tests for FeeAlerts component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeeAlerts from './FeeAlerts';
import type { Student, FeeRecord } from '../types';

describe('FeeAlerts', () => {
  const mockStudent: Student = {
    id: 'student-1',
    fullName: 'Test Student',
    dateOfBirth: new Date('2010-01-01'),
    age: 16,
    gender: 'Male',
    contactPhone: '1234567890',
    strengths: [],
    weaknesses: [],
    skillLevel: 'Beginner',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockOverdueFee: FeeRecord = {
    id: 'fee-1',
    studentId: 'student-1',
    amount: 3000,
    monthYear: '2025-10',
    dueDate: new Date('2025-10-10'),
    status: 'OVERDUE',
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2025-10-20'),
  };

  it('should render success state when no overdue fees', () => {
    render(<FeeAlerts overdueFees={[]} />);
    expect(screen.getByText('Fee Alerts')).toBeInTheDocument();
    expect(screen.getByText(/all fees up to date/i)).toBeInTheDocument();
  });

  it('should render alert state when there are overdue fees', () => {
    const overdueFees = [
      {
        student: mockStudent,
        overdueFees: [mockOverdueFee],
        totalOverdue: 3000,
      },
    ];
    render(<FeeAlerts overdueFees={overdueFees} />);
    expect(screen.getByText('Fee Alerts')).toBeInTheDocument();
    // Check for the count display
    expect(screen.getByText('1 overdue')).toBeInTheDocument();
  });

  it('should display student names with overdue fees', () => {
    const overdueFees = [
      {
        student: mockStudent,
        overdueFees: [mockOverdueFee],
        totalOverdue: 3000,
      },
    ];
    render(<FeeAlerts overdueFees={overdueFees} />);
    expect(screen.getByText('Test Student')).toBeInTheDocument();
  });

  it('should display total overdue amount', () => {
    const overdueFees = [
      {
        student: mockStudent,
        overdueFees: [mockOverdueFee],
        totalOverdue: 3000,
      },
    ];
    render(<FeeAlerts overdueFees={overdueFees} />);
    expect(screen.getByText('₹3,000')).toBeInTheDocument();
  });

  it('should display count of overdue payments per student', () => {
    const overdueFees = [
      {
        student: mockStudent,
        overdueFees: [mockOverdueFee, mockOverdueFee],
        totalOverdue: 6000,
      },
    ];
    render(<FeeAlerts overdueFees={overdueFees} />);
    // The component shows total overdue count
    expect(screen.getByText('2 overdue')).toBeInTheDocument();
  });

  it('should limit display to 3 students and show more text', () => {
    const overdueFees = Array.from({ length: 7 }, (_, i) => ({
      student: { ...mockStudent, id: `student-${i}`, fullName: `Student ${i}` },
      overdueFees: [mockOverdueFee],
      totalOverdue: 3000,
    }));
    render(<FeeAlerts overdueFees={overdueFees} />);
    expect(screen.getByText(/\+4 more/i)).toBeInTheDocument();
  });

  it('should call onViewDetails when button is clicked', () => {
    const onViewDetails = vi.fn();
    const overdueFees = [
      {
        student: mockStudent,
        overdueFees: [mockOverdueFee],
        totalOverdue: 3000,
      },
    ];
    render(<FeeAlerts overdueFees={overdueFees} onViewDetails={onViewDetails} />);
    
    const button = screen.getByText(/view all/i);
    button.click();
    expect(onViewDetails).toHaveBeenCalledTimes(1);
  });

  it('should not render view details button when onViewDetails is not provided', () => {
    const overdueFees = [
      {
        student: mockStudent,
        overdueFees: [mockOverdueFee],
        totalOverdue: 3000,
      },
    ];
    render(<FeeAlerts overdueFees={overdueFees} />);
    expect(screen.queryByText(/view all fee details/i)).not.toBeInTheDocument();
  });
});

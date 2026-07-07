import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncomeLedger } from './IncomeLedger';
import type { FeeRecord, Student, PaymentMethod } from '../types';

/**
 * IncomeLedger Component Tests
 * 
 * Tests verify:
 * - **Property 19: Income records display all fee transactions**
 * - **Property 23: Date range filter narrows transactions**
 * - **Property 24: Transactions sorted by date descending**
 *
 * **Validates: Requirements 13.1, 13.2, 13.3**
 */

describe('IncomeLedger', () => {
  const mockStudents: Student[] = [
    {
      id: 'student-1',
      fullName: 'Arjun Kumar',
      dateOfBirth: new Date('2015-03-15'),
      age: 9,
      gender: 'Male',
      contactPhone: '9876543210',
      batchId: 'batch-1',
      assignedCoachId: 'coach-1',
      skillLevel: 'Beginner',
      strengths: [],
      weaknesses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'student-2',
      fullName: 'Priya Sharma',
      dateOfBirth: new Date('2014-08-22'),
      age: 10,
      gender: 'Female',
      contactPhone: '9876543211',
      batchId: 'batch-1',
      assignedCoachId: 'coach-1',
      skillLevel: 'Intermediate',
      strengths: [],
      weaknesses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockFeeRecords: FeeRecord[] = [
    {
      id: 'fee-1',
      studentId: 'student-1',
      amount: 2000,
      monthYear: '2026-01',
      dueDate: new Date('2026-01-31'),
      paidDate: new Date('2026-01-15'),
      status: 'PAID',
      paymentMethod: 'CASH' as PaymentMethod,
      transactionRef: 'TXN001',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'fee-2',
      studentId: 'student-2',
      amount: 2000,
      monthYear: '2026-01',
      dueDate: new Date('2026-01-31'),
      paidDate: new Date('2026-01-20'),
      status: 'PAID',
      paymentMethod: 'UPI' as PaymentMethod,
      transactionRef: 'TXN002',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'fee-3',
      studentId: 'student-1',
      amount: 2000,
      monthYear: '2026-02',
      dueDate: new Date('2026-02-28'),
      paidDate: new Date('2026-02-10'),
      status: 'PAID',
      paymentMethod: 'BANK_TRANSFER' as PaymentMethod,
      transactionRef: 'TXN003',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'fee-4',
      studentId: 'student-1',
      amount: 2000,
      monthYear: '2026-03',
      dueDate: new Date('2026-03-31'),
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('displays all PAID fee records as income', () => {
    render(<IncomeLedger fees={mockFeeRecords} students={mockStudents} />);

    // Should display 3 PAID records (fee-1, fee-2, fee-3)
    const rows = screen.getAllByRole('row');
    // rows[0] is header, so 3 data rows = 4 total rows
    expect(rows).toHaveLength(4);
  });

  it('displays student names from fee records', () => {
    render(<IncomeLedger fees={mockFeeRecords} students={mockStudents} />);

    // Check that student names appear in the rendered output
    const arjunElements = screen.queryAllByText('Arjun Kumar');
    const priyaElements = screen.queryAllByText('Priya Sharma');

    expect(arjunElements.length).toBeGreaterThan(0);
    expect(priyaElements.length).toBeGreaterThan(0);
  });

  it('displays fee amounts formatted with ₹ symbol', () => {
    render(<IncomeLedger fees={mockFeeRecords} students={mockStudents} />);

    const amountText = screen.queryAllByText('₹2,000.00');
    expect(amountText.length).toBeGreaterThan(0);
  });

  it('displays collection dates in DD MMM YYYY format', () => {
    render(<IncomeLedger fees={mockFeeRecords} students={mockStudents} />);

    // Check for formatted dates (e.g., "15 Jan 2026")
    const dates = screen.queryAllByText(/\d{1,2} \w{3} \d{4}/);
    expect(dates.length).toBeGreaterThan(0);
  });

  it('displays payment methods correctly', () => {
    render(<IncomeLedger fees={mockFeeRecords} students={mockStudents} />);

    const cashElements = screen.queryAllByText('Cash');
    const upiElements = screen.queryAllByText('UPI');
    const bankElements = screen.queryAllByText('Bank Transfer');

    expect(cashElements.length).toBeGreaterThan(0);
    expect(upiElements.length).toBeGreaterThan(0);
    expect(bankElements.length).toBeGreaterThan(0);
  });

  it('displays transaction references', () => {
    render(<IncomeLedger fees={mockFeeRecords} students={mockStudents} />);

    expect(screen.queryAllByText('TXN001').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('TXN002').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('TXN003').length).toBeGreaterThan(0);
  });

  it('excludes PENDING fees from income records', () => {
    render(<IncomeLedger fees={mockFeeRecords} students={mockStudents} />);

    // PENDING fee should not be in the display
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4); // 1 header + 3 data rows
  });

  it('shows Unknown Student for missing student references', () => {
    const feesWithInvalidStudent: FeeRecord[] = [
      {
        id: 'fee-5',
        studentId: 'nonexistent-student',
        amount: 1500,
        monthYear: '2026-01',
        dueDate: new Date('2026-01-31'),
        paidDate: new Date('2026-01-25'),
        status: 'PAID',
        paymentMethod: 'CASH' as PaymentMethod,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    render(
      <IncomeLedger fees={feesWithInvalidStudent} students={mockStudents} />
    );

    expect(screen.queryAllByText('Unknown Student').length).toBeGreaterThan(0);
  });

  describe('Date range filtering', () => {
    it('filters records within date range', () => {
      const dateRange = {
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31'),
      };

      render(
        <IncomeLedger
          fees={mockFeeRecords}
          students={mockStudents}
          dateRange={dateRange}
        />
      );

      // Should show only fee-1 and fee-2 (January records)
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(3); // 1 header + 2 data rows
    });

    it('excludes records outside date range', () => {
      const dateRange = {
        from: new Date('2026-02-01'),
        to: new Date('2026-02-28'),
      };

      render(
        <IncomeLedger
          fees={mockFeeRecords}
          students={mockStudents}
          dateRange={dateRange}
        />
      );

      // Should show only fee-3 (February record)
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(2); // 1 header + 1 data row
    });

    it('displays empty state when no records in date range', () => {
      const dateRange = {
        from: new Date('2026-05-01'),
        to: new Date('2026-05-31'),
      };

      render(
        <IncomeLedger
          fees={mockFeeRecords}
          students={mockStudents}
          dateRange={dateRange}
        />
      );

      expect(
        screen.getByText('No income records found in the selected date range')
      ).toBeInTheDocument();
    });

    it('includes records on boundary dates', () => {
      const recordOnBoundary: FeeRecord = {
        id: 'fee-boundary',
        studentId: 'student-1',
        amount: 2000,
        monthYear: '2026-01',
        dueDate: new Date('2026-01-31'),
        paidDate: new Date('2026-01-01'), // On from date
        status: 'PAID',
        paymentMethod: 'CASH' as PaymentMethod,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dateRange = {
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31'),
      };

      render(
        <IncomeLedger
          fees={[recordOnBoundary]}
          students={mockStudents}
          dateRange={dateRange}
        />
      );

      expect(screen.queryAllByText('Arjun Kumar').length).toBeGreaterThan(0);
    });
  });

  describe('Sorting by date descending', () => {
    it('sorts records by collection date descending (most recent first)', () => {
      render(
        <IncomeLedger fees={mockFeeRecords} students={mockStudents} />
      );

      // Get all rows except header
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1); // Skip header

      // Extract transaction refs which correspond to dates
      const transactionRefs = dataRows.map((row) => row.textContent);

      // TXN003 (Feb 10) should come before TXN002 (Jan 20)
      const txn003Index = transactionRefs.findIndex((text) =>
        text?.includes('TXN003')
      );
      const txn002Index = transactionRefs.findIndex((text) =>
        text?.includes('TXN002')
      );

      expect(txn003Index).toBeLessThan(txn002Index);
    });

    it('handles records with missing paidDate gracefully', () => {
      const feesWithMissingDate: FeeRecord[] = [
        mockFeeRecords[0], // Has paidDate
        {
          id: 'fee-no-date',
          studentId: 'student-2',
          amount: 1500,
          monthYear: '2026-03',
          dueDate: new Date('2026-03-31'),
          status: 'PAID',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      render(
        <IncomeLedger fees={feesWithMissingDate} students={mockStudents} />
      );

      // Should display both records, with "—" for missing date
      expect(screen.queryAllByText('—').length).toBeGreaterThan(0);
    });
  });

  describe('Empty state', () => {
    it('displays empty state message when no fees provided', () => {
      render(<IncomeLedger fees={[]} students={mockStudents} />);

      expect(
        screen.getByText('No income records found')
      ).toBeInTheDocument();
    });

    it('displays empty state message when no PAID fees', () => {
      const onlyPendingFees: FeeRecord[] = [
        {
          id: 'fee-pending',
          studentId: 'student-1',
          amount: 2000,
          monthYear: '2026-01',
          dueDate: new Date('2026-01-31'),
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      render(
        <IncomeLedger fees={onlyPendingFees} students={mockStudents} />
      );

      expect(
        screen.getByText('No income records found')
      ).toBeInTheDocument();
    });

    it('displays record count in header when records exist', () => {
      render(
        <IncomeLedger fees={mockFeeRecords} students={mockStudents} />
      );

      expect(screen.getByText('Income Records (3)')).toBeInTheDocument();
    });
  });

  describe('Responsive design', () => {
    it('renders table on desktop', () => {
      const { container } = render(
        <IncomeLedger fees={mockFeeRecords} students={mockStudents} />
      );

      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('renders cards on mobile', () => {
      const { container } = render(
        <IncomeLedger fees={mockFeeRecords} students={mockStudents} />
      );

      // Mobile layout should have the lg:hidden container
      const mobileContainer = container.querySelector('.lg\\:hidden');
      expect(mobileContainer).toBeInTheDocument();
    });
  });

  describe('Currency formatting', () => {
    it('formats amounts with proper decimal places', () => {
      const feeWithDecimal: FeeRecord = {
        id: 'fee-decimal',
        studentId: 'student-1',
        amount: 2500.5,
        monthYear: '2026-01',
        dueDate: new Date('2026-01-31'),
        paidDate: new Date('2026-01-15'),
        status: 'PAID',
        paymentMethod: 'CASH' as PaymentMethod,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <IncomeLedger fees={[feeWithDecimal]} students={mockStudents} />
      );

      expect(screen.queryAllByText('₹2,500.50').length).toBeGreaterThan(0);
    });

    it('formats amounts with thousand separators', () => {
      const feeWithThousands: FeeRecord = {
        id: 'fee-thousands',
        studentId: 'student-1',
        amount: 15000,
        monthYear: '2026-01',
        dueDate: new Date('2026-01-31'),
        paidDate: new Date('2026-01-15'),
        status: 'PAID',
        paymentMethod: 'CASH' as PaymentMethod,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <IncomeLedger fees={[feeWithThousands]} students={mockStudents} />
      );

      expect(screen.queryAllByText('₹15,000.00').length).toBeGreaterThan(0);
    });
  });

  describe('Date formatting', () => {
    it('formats dates in DD MMM YYYY format', () => {
      const feeWithSpecificDate: FeeRecord = {
        id: 'fee-date-format',
        studentId: 'student-1',
        amount: 2000,
        monthYear: '2026-03',
        dueDate: new Date('2026-03-25'),
        paidDate: new Date('2026-03-25'),
        status: 'PAID',
        paymentMethod: 'CASH' as PaymentMethod,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <IncomeLedger fees={[feeWithSpecificDate]} students={mockStudents} />
      );

      // Should display as "25 Mar 2026"
      expect(screen.queryAllByText('25 Mar 2026').length).toBeGreaterThan(0);
    });
  });

  describe('Payment method display', () => {
    it('displays "Cash" for CASH payment method', () => {
      render(
        <IncomeLedger fees={mockFeeRecords} students={mockStudents} />
      );

      const cashElements = screen.queryAllByText('Cash');
      expect(cashElements.length).toBeGreaterThan(0);
    });

    it('displays placeholder dash when payment method is missing', () => {
      const feeWithoutMethod: FeeRecord = {
        id: 'fee-no-method',
        studentId: 'student-1',
        amount: 2000,
        monthYear: '2026-01',
        dueDate: new Date('2026-01-31'),
        paidDate: new Date('2026-01-15'),
        status: 'PAID',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <IncomeLedger fees={[feeWithoutMethod]} students={mockStudents} />
      );

      // Should have dashes for missing data
      const dashes = screen.queryAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });
});

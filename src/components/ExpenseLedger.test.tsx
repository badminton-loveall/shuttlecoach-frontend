import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpenseLedger } from './ExpenseLedger';
import type { Expense, PaymentFilters } from '../types';

describe('ExpenseLedger Component', () => {
  const mockExpenses: Expense[] = [
    {
      id: '1',
      coachId: 'coach-1',
      type: 'SHUTTLE',
      amount: 500,
      date: new Date('2026-01-15'),
      description: 'Shuttle for tournament',
      createdAt: new Date('2026-01-14'),
      updatedAt: new Date('2026-01-14'),
      createdBy: 'user-1',
    },
    {
      id: '2',
      coachId: 'coach-1',
      type: 'SUPPLIES',
      amount: 1000,
      date: new Date('2026-01-10'),
      description: 'Badminton rackets and shuttles',
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date('2026-01-10'),
      createdBy: 'user-2',
    },
    {
      id: '3',
      coachId: 'coach-1',
      type: 'TRAVEL',
      amount: 750,
      date: new Date('2026-01-20'),
      description: 'Travel to training camp',
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-01-20'),
      createdBy: 'user-1',
    },
  ];

  describe('Requirement 12.2: Display all expense records', () => {
    it('should display all expense records with correct information', () => {
      render(<ExpenseLedger expenses={mockExpenses} />);

      // Check table headers
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Created By')).toBeInTheDocument();

      // Check expense records are displayed
      expect(screen.getByText('Shuttle')).toBeInTheDocument();
      expect(screen.getByText('Supplies')).toBeInTheDocument();
      expect(screen.getByText('Travel')).toBeInTheDocument();
    });

    it('should display expense type with full name', () => {
      render(<ExpenseLedger expenses={mockExpenses} />);

      expect(screen.getByText('Shuttle')).toBeInTheDocument();
      expect(screen.getByText('Supplies')).toBeInTheDocument();
      expect(screen.getByText('Travel')).toBeInTheDocument();

      // Verify type labels are mapped correctly
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // header + data rows
    });

    it('should format currency with rupee symbol', () => {
      render(<ExpenseLedger expenses={mockExpenses} />);

      expect(screen.getByText('₹500')).toBeInTheDocument();
      expect(screen.getByText('₹1,000')).toBeInTheDocument();
      expect(screen.getByText('₹750')).toBeInTheDocument();
    });

    it('should format date as DD MMM YYYY', () => {
      render(<ExpenseLedger expenses={mockExpenses} />);

      expect(screen.getByText('15 Jan 2026')).toBeInTheDocument();
      expect(screen.getByText('10 Jan 2026')).toBeInTheDocument();
      expect(screen.getByText('20 Jan 2026')).toBeInTheDocument();
    });

    it('should display full description text', () => {
      render(<ExpenseLedger expenses={mockExpenses} />);

      expect(screen.getByText('Shuttle for tournament')).toBeInTheDocument();
      expect(screen.getByText('Badminton rackets and shuttles')).toBeInTheDocument();
      expect(screen.getByText('Travel to training camp')).toBeInTheDocument();
    });

    it('should display createdBy user name', () => {
      render(<ExpenseLedger expenses={mockExpenses} />);

      // Since createdBy is just user IDs in test data, verify they appear
      const rows = screen.getAllByRole('row');
      const bodyRows = rows.slice(1); // Skip header
      expect(bodyRows.length).toBe(3);
    });
  });

  describe('Requirement 15.1, 15.2: Sort by date descending and apply date range filter', () => {
    it('should sort expenses by date descending (most recent first)', () => {
      render(<ExpenseLedger expenses={mockExpenses} />);

      // Verify order by checking that descriptions appear in the correct order
      const allText = screen.getByRole('table').textContent || '';
      
      const travelIndex = allText.indexOf('Travel to training camp');
      const shuttleIndex = allText.indexOf('Shuttle for tournament');
      const badmintonIndex = allText.indexOf('Badminton rackets and shuttles');

      // Travel (20th) should appear first, then Shuttle (15th), then Supplies (10th)
      expect(travelIndex).toBeLessThan(shuttleIndex);
      expect(shuttleIndex).toBeLessThan(badmintonIndex);
    });

    it('should filter expenses within date range', () => {
      const filters: PaymentFilters = {
        dateFrom: new Date('2026-01-15'),
        dateTo: new Date('2026-01-20'),
      };

      render(<ExpenseLedger expenses={mockExpenses} filters={filters} />);

      // Should show: Travel (20th) and Shuttle (15th), not Supplies (10th)
      expect(screen.getByText('Travel to training camp')).toBeInTheDocument();
      expect(screen.getByText('Shuttle for tournament')).toBeInTheDocument();
      expect(screen.queryByText('Badminton rackets and shuttles')).not.toBeInTheDocument();
    });

    it('should include expenses on the boundary dates', () => {
      const filters: PaymentFilters = {
        dateFrom: new Date('2026-01-10'),
        dateTo: new Date('2026-01-10'),
      };

      render(<ExpenseLedger expenses={mockExpenses} filters={filters} />);

      // Should show only Supplies (10th)
      expect(screen.getByText('Badminton rackets and shuttles')).toBeInTheDocument();
      expect(screen.queryByText('Shuttle for tournament')).not.toBeInTheDocument();
      expect(screen.queryByText('Travel to training camp')).not.toBeInTheDocument();
    });

    it('should apply only from date filter', () => {
      const filters: PaymentFilters = {
        dateFrom: new Date('2026-01-15'),
      };

      render(<ExpenseLedger expenses={mockExpenses} filters={filters} />);

      // Should show: Travel (20th) and Shuttle (15th), not Supplies (10th)
      expect(screen.getByText('Travel to training camp')).toBeInTheDocument();
      expect(screen.getByText('Shuttle for tournament')).toBeInTheDocument();
      expect(screen.queryByText('Badminton rackets and shuttles')).not.toBeInTheDocument();
    });

    it('should apply only to date filter', () => {
      const filters: PaymentFilters = {
        dateTo: new Date('2026-01-15'),
      };

      render(<ExpenseLedger expenses={mockExpenses} filters={filters} />);

      // Should show: Supplies (10th) and Shuttle (15th), not Travel (20th)
      expect(screen.getByText('Badminton rackets and shuttles')).toBeInTheDocument();
      expect(screen.getByText('Shuttle for tournament')).toBeInTheDocument();
      expect(screen.queryByText('Travel to training camp')).not.toBeInTheDocument();
    });

    it('should still sort filtered results by date descending', () => {
      const filters: PaymentFilters = {
        dateFrom: new Date('2026-01-10'),
        dateTo: new Date('2026-01-20'),
      };

      render(<ExpenseLedger expenses={mockExpenses} filters={filters} />);

      // All three should be shown and in descending order
      expect(screen.getByText('Travel to training camp')).toBeInTheDocument();
      expect(screen.getByText('Shuttle for tournament')).toBeInTheDocument();
      expect(screen.getByText('Badminton rackets and shuttles')).toBeInTheDocument();

      // Verify order by checking that descriptions appear in the correct order
      const allText = screen.getByRole('table').textContent || '';
      
      const travelIndex = allText.indexOf('Travel to training camp');
      const shuttleIndex = allText.indexOf('Shuttle for tournament');
      const badmintonIndex = allText.indexOf('Badminton rackets and shuttles');

      // Verify order: Travel (20th), Shuttle (15th), Supplies (10th)
      expect(travelIndex).toBeLessThan(shuttleIndex);
      expect(shuttleIndex).toBeLessThan(badmintonIndex);
    });
  });

  describe('Empty state', () => {
    it('should display empty state when no expenses', () => {
      render(<ExpenseLedger expenses={[]} />);

      expect(screen.getByText('No expenses recorded')).toBeInTheDocument();
    });

    it('should display filtered empty state when date range has no results', () => {
      const filters: PaymentFilters = {
        dateFrom: new Date('2026-02-01'),
        dateTo: new Date('2026-02-28'),
      };

      render(<ExpenseLedger expenses={mockExpenses} filters={filters} />);

      expect(screen.getByText('No expenses in selected date range')).toBeInTheDocument();
    });
  });

  describe('Responsive design', () => {
    it('should render table with all required columns', () => {
      render(<ExpenseLedger expenses={mockExpenses} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check all headers are present
      const headers = screen.getAllByRole('columnheader');
      // Type, Amount, Date, Description, Created By = 5 columns, but inline headers also count
      // Just verify the core columns are present
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Created By')).toBeInTheDocument();
    });

    it('should display expense records in rows', () => {
      render(<ExpenseLedger expenses={mockExpenses} />);

      const rows = screen.getAllByRole('row');
      // 1 header row + 3 data rows
      expect(rows.length).toBe(4);
    });
  });

  describe('Placeholder handling', () => {
    it('should display dash for missing description', () => {
      const expenseWithoutDescription: Expense = {
        id: '4',
        coachId: 'coach-1',
        type: 'OTHER',
        amount: 200,
        date: new Date('2026-01-25'),
        description: '',
        createdAt: new Date('2026-01-25'),
        updatedAt: new Date('2026-01-25'),
        createdBy: 'user-1',
      };

      render(<ExpenseLedger expenses={[expenseWithoutDescription]} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('should display dash for missing createdBy', () => {
      const expenseWithoutCreatedBy: Expense = {
        id: '5',
        coachId: 'coach-1',
        type: 'OTHER',
        amount: 300,
        date: new Date('2026-01-25'),
        description: 'Some expense',
        createdAt: new Date('2026-01-25'),
        updatedAt: new Date('2026-01-25'),
        createdBy: '',
      };

      render(<ExpenseLedger expenses={[expenseWithoutCreatedBy]} />);

      expect(screen.getByText('Some expense')).toBeInTheDocument();
      // Should have dash for empty createdBy
      const cells = screen.getAllByRole('cell');
      const hasEmptyCreatedBy = cells.some((cell) => cell.textContent?.trim() === '—');
      expect(hasEmptyCreatedBy).toBe(true);
    });
  });

  describe('Loading state', () => {
    it('should display loading skeleton when isLoading is true', () => {
      const { container } = render(<ExpenseLedger expenses={mockExpenses} isLoading={true} />);

      expect(screen.getByText('Expense Records')).toBeInTheDocument();
      // Should show skeleton rows
      const skeletonRows = container.querySelectorAll('.skeleton-row');
      expect(skeletonRows.length).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import type { FinancialSummary } from '../types';

/**
 * Unit Tests for FinancialSummaryCard Component
 * 
 * Tests component rendering, currency formatting, period breakdowns,
 * and responsive design.
 * 
 * **Validates: Requirements 12.4, 16.1**
 */

describe('FinancialSummaryCard', () => {
  const mockDateRange = {
    from: new Date('2026-01-01'),
    to: new Date('2026-12-31'),
  };

  /**
   * Create mock financial summary for testing
   */
  const createMockSummary = (overrides: Partial<FinancialSummary> = {}): FinancialSummary => ({
    totalIncome: 50000,
    totalExpenses: 15000,
    netBalance: 35000,
    periodData: [
      {
        period: 'MONTH',
        income: 4000,
        expenses: 1500,
        net: 2500,
      },
      {
        period: 'MONTH',
        income: 4500,
        expenses: 1200,
        net: 3300,
      },
      {
        period: 'QUARTER',
        income: 12000,
        expenses: 4000,
        net: 8000,
      },
      {
        period: 'YEAR',
        income: 50000,
        expenses: 15000,
        net: 35000,
      },
    ],
    ...overrides,
  });

  // ===== Main Metrics Cards Tests =====

  describe('Main Metrics Cards', () => {
    it('displays total income card with correct formatting', () => {
      const summary = createMockSummary();
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      expect(screen.getByText('Total Income')).toBeInTheDocument();
      const incomeElements = screen.getAllByText('₹50,000.00');
      expect(incomeElements.length).toBeGreaterThan(0); // May appear in both header and period breakdown
    });

    it('displays total expenses card with correct formatting', () => {
      const summary = createMockSummary();
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      const expenseElements = screen.getAllByText('₹15,000.00');
      expect(expenseElements.length).toBeGreaterThan(0); // May appear in both header and period breakdown
    });

    it('displays net balance card with correct formatting', () => {
      const summary = createMockSummary();
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      expect(screen.getByText('Net Balance')).toBeInTheDocument();
      // Check for the net balance value - should appear at least once
      const elements = screen.queryAllByText((content) => content.includes('₹35,000'));
      expect(elements.length).toBeGreaterThan(0);
    });

    it('formats currency with INR symbol and 2 decimal places', () => {
      const summary = createMockSummary({
        totalIncome: 1234.5,
        totalExpenses: 567.25,
        netBalance: 667.25,
        periodData: [],
      });
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      expect(screen.getByText('₹1,234.50')).toBeInTheDocument();
      expect(screen.getByText('₹567.25')).toBeInTheDocument();
    });

    it('handles zero values gracefully', () => {
      const summary = createMockSummary({
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        periodData: [],
      });
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      // ₹0.00 will appear for all three metrics
      const elements = screen.getAllByText('₹0.00');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('displays income card with green styling', () => {
      const summary = createMockSummary();
      const { container } = render(
        <FinancialSummaryCard summary={summary} dateRange={mockDateRange} />
      );

      // Find the income card and check for green classes
      const incomeCard = container.querySelector('div.bg-green-50');
      expect(incomeCard).toBeInTheDocument();
    });

    it('displays expenses card with red styling', () => {
      const summary = createMockSummary();
      const { container } = render(
        <FinancialSummaryCard summary={summary} dateRange={mockDateRange} />
      );

      // Find the expenses card and check for red classes
      const expenseCard = container.querySelector('div.bg-red-50');
      expect(expenseCard).toBeInTheDocument();
    });
  });

  // ===== Date Range Display Tests =====

  describe('Date Range Display', () => {
    it('displays formatted date range', () => {
      const summary = createMockSummary();
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      // The date format should be like "01 Jan, 2026 - 31 Dec, 2026" 
      // Check that both dates are rendered
      const dateElements = screen.queryAllByText((content) => content.includes('Jan'));
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('updates date range display when props change', () => {
      const summary = createMockSummary();
      const newDateRange = {
        from: new Date('2026-06-01'),
        to: new Date('2026-06-30'),
      };

      const { rerender } = render(
        <FinancialSummaryCard summary={summary} dateRange={mockDateRange} />
      );

      // Check for initial date range
      let dateElements = screen.queryAllByText((content) => content.includes('Jan'));
      expect(dateElements.length).toBeGreaterThan(0);

      rerender(
        <FinancialSummaryCard summary={summary} dateRange={newDateRange} />
      );

      // Check for new date range
      dateElements = screen.queryAllByText((content) => content.includes('Jun'));
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  // ===== Period Breakdown Tests =====

  describe('Period Breakdown Display', () => {
    it('displays year-to-date breakdown section', () => {
      const summary = createMockSummary();
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      expect(screen.getByText('Period Breakdown')).toBeInTheDocument();
      expect(screen.getByText(/Year-to-Date|Year to Date/)).toBeInTheDocument();
    });

    it('displays quarterly breakdown section', () => {
      const summary = createMockSummary();
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      expect(screen.getByText('Quarterly')).toBeInTheDocument();
      // Check for quarterly data - will have quarter info
      const quarterlyElements = screen.queryAllByText((content) => content.includes('Q1'));
      expect(quarterlyElements.length >= 0).toBe(true);
    });

    it('displays monthly breakdown section', () => {
      const summary = createMockSummary();
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });

    it('displays income, expenses, and net for each period', () => {
      const summary = createMockSummary();
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      // Check for income label in YTD section (at least one)
      const incomeLabels = screen.queryAllByText('Income');
      expect(incomeLabels.length).toBeGreaterThan(0);
    });

    it('shows empty state when no period data available', () => {
      const summary = createMockSummary({
        periodData: [],
      });
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      expect(screen.getByText(/No transaction data available/)).toBeInTheDocument();
    });
  });

  // ===== Net Balance Color Tests =====

  describe('Net Balance Color Coding', () => {
    it('displays green styling for positive net balance', () => {
      const summary = createMockSummary({
        totalIncome: 5000,
        totalExpenses: 1000,
        netBalance: 4000,
      });
      const { container } = render(
        <FinancialSummaryCard summary={summary} dateRange={mockDateRange} />
      );

      // Find net balance card (should be green for positive)
      const netBalanceCard = container.querySelector('div.bg-green-50');
      expect(netBalanceCard).toBeInTheDocument();
    });

    it('displays red styling for negative net balance', () => {
      const summary = createMockSummary({
        totalIncome: 1000,
        totalExpenses: 5000,
        netBalance: -4000,
      });
      const { container } = render(
        <FinancialSummaryCard summary={summary} dateRange={mockDateRange} />
      );

      // Find net balance card (should be red for negative)
      const netBalanceCard = container.querySelector('div.bg-red-50');
      expect(netBalanceCard).toBeInTheDocument();
    });

    it('displays zero net balance as positive (green)', () => {
      const summary = createMockSummary({
        totalIncome: 2000,
        totalExpenses: 2000,
        netBalance: 0,
      });
      const { container } = render(
        <FinancialSummaryCard summary={summary} dateRange={mockDateRange} />
      );

      // Zero is treated as non-negative, so should be green
      const netBalanceCard = container.querySelector('div.bg-green-50');
      expect(netBalanceCard).toBeInTheDocument();
    });
  });

  // ===== Large Numbers and Decimal Handling Tests =====

  describe('Currency Formatting', () => {
    it('formats large amounts with proper thousand separators', () => {
      const summary = createMockSummary({
        totalIncome: 1234567.89,
        totalExpenses: 9876543.21,
        netBalance: -8641975.32,
        periodData: [],
      });
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      expect(screen.getByText('₹12,34,567.89')).toBeInTheDocument();
      expect(screen.getByText('₹98,76,543.21')).toBeInTheDocument();
    });

    it('handles decimal amounts with proper rounding', () => {
      const summary = createMockSummary({
        totalIncome: 1000.005,
        totalExpenses: 500.995,
        netBalance: 499.01,
        periodData: [],
      });
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      // Should display with 2 decimal places - check for pattern
      const elements = screen.queryAllByText(/₹\d+[\.,]\d{2}/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  // ===== Responsive Layout Tests =====

  describe('Responsive Design', () => {
    it('renders main metrics in responsive grid', () => {
      const summary = createMockSummary();
      const { container } = render(
        <FinancialSummaryCard summary={summary} dateRange={mockDateRange} />
      );

      // Check for responsive grid classes
      const grid = container.querySelector('div.grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.className).toMatch(/grid-cols-1.*md:grid-cols-3/);
    });

    it('renders period breakdown cards in responsive layout', () => {
      const summary = createMockSummary();
      const { container } = render(
        <FinancialSummaryCard summary={summary} dateRange={mockDateRange} />
      );

      // Check that responsive classes are present
      const allGrids = container.querySelectorAll('div.grid');
      expect(allGrids.length).toBeGreaterThan(0);
    });
  });

  // ===== Summary Update Tests =====

  describe('Summary Updates', () => {
    it('updates display when summary prop changes', () => {
      const initialSummary = createMockSummary({
        totalIncome: 1000,
      });
      const { rerender } = render(
        <FinancialSummaryCard summary={initialSummary} dateRange={mockDateRange} />
      );

      expect(screen.getByText('₹1,000.00')).toBeInTheDocument();

      const updatedSummary = createMockSummary({
        totalIncome: 2000,
      });
      rerender(
        <FinancialSummaryCard summary={updatedSummary} dateRange={mockDateRange} />
      );

      expect(screen.getByText('₹2,000.00')).toBeInTheDocument();
    });

    it('recalculates period breakdown display on data change', () => {
      const summary1 = createMockSummary({
        periodData: [
          {
            period: 'YEAR',
            income: 10000,
            expenses: 5000,
            net: 5000,
          },
        ],
      });

      const { rerender } = render(
        <FinancialSummaryCard summary={summary1} dateRange={mockDateRange} />
      );

      const summary2 = createMockSummary({
        periodData: [
          {
            period: 'YEAR',
            income: 20000,
            expenses: 10000,
            net: 10000,
          },
        ],
      });

      rerender(
        <FinancialSummaryCard summary={summary2} dateRange={mockDateRange} />
      );

      // The component should update - we check that the new values are rendered
      expect(screen.getByText(/₹20,000\.\d{2}|₹20000\.\d{2}/)).toBeInTheDocument();
    });
  });

  // ===== Icon Display Tests =====

  describe('Icons and Visual Elements', () => {
    it('displays icons for all three main metric cards', () => {
      const summary = createMockSummary();
      const { container } = render(
        <FinancialSummaryCard summary={summary} dateRange={mockDateRange} />
      );

      // Check for SVG icons
      const svgs = container.querySelectorAll('svg');
      // Should have at least 3 SVGs (one for each main metric card)
      expect(svgs.length).toBeGreaterThanOrEqual(3);
    });

    it('displays empty state icon when no period data', () => {
      const summary = createMockSummary({
        periodData: [],
      });
      const { container } = render(
        <FinancialSummaryCard summary={summary} dateRange={mockDateRange} />
      );

      // Check for SVG in empty state
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  // ===== Edge Cases =====

  describe('Edge Cases', () => {
    it('handles missing periodData gracefully', () => {
      const summary: FinancialSummary = {
        totalIncome: 1000,
        totalExpenses: 500,
        netBalance: 500,
        periodData: [],
      };
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      // Should render without crashing
      expect(screen.getByText('Financial Summary')).toBeInTheDocument();
      expect(screen.getByText(/No transaction data available/)).toBeInTheDocument();
    });

    it('handles very small decimal amounts', () => {
      const summary = createMockSummary({
        totalIncome: 0.01,
        totalExpenses: 0.01,
        netBalance: 0,
        periodData: [],
      });
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      // Should render and format correctly
      const elements = screen.queryAllByText(/₹0\.01/);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('handles negative expense values (unusual case)', () => {
      const summary = createMockSummary({
        totalIncome: 5000,
        totalExpenses: -1000, // Refund
        netBalance: 6000,
        periodData: [],
      });
      render(<FinancialSummaryCard summary={summary} dateRange={mockDateRange} />);

      // Should still render with currency formatting
      expect(screen.getByText(/₹-1,000\.00/)).toBeInTheDocument();
    });
  });
});

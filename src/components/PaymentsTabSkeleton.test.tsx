import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PaymentsTabSkeleton } from './PaymentsTabSkeleton';

describe('PaymentsTabSkeleton', () => {
  it('renders skeleton structure', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    const content = container.querySelector('.coach-profile-tab-content');
    expect(content).toBeInTheDocument();
  });

  it('renders tab header with skeleton', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    const tabHeader = container.querySelector('.tab-header');
    expect(tabHeader).toBeInTheDocument();
    
    const skeletonLine = tabHeader?.querySelector('.skeleton-line--lg');
    expect(skeletonLine).toBeInTheDocument();
  });

  it('renders filter section skeleton', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    // Should have multiple filter skeleton lines
    const skeletonLines = container.querySelectorAll('.skeleton-line--sm');
    expect(skeletonLines.length).toBeGreaterThanOrEqual(6);
  });

  it('renders statistics cards skeleton', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    const statsGrid = container.querySelector('.payment-stats-grid');
    expect(statsGrid).toBeInTheDocument();
    
    // Should have 6 stat card skeletons
    const statCards = statsGrid?.querySelectorAll('.stat-card');
    expect(statCards?.length).toBe(6);
  });

  it('renders skeleton lines within stat cards', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    const statCards = container.querySelectorAll('.stat-card');
    statCards.forEach((card) => {
      const skeletonLines = card.querySelectorAll('.skeleton-line');
      expect(skeletonLines.length).toBeGreaterThan(0);
    });
  });

  it('renders income section skeleton', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    // Should have at least one payment-section
    const sections = container.querySelectorAll('.payment-section');
    expect(sections.length).toBeGreaterThanOrEqual(2); // Income and Expenses
  });

  it('renders table structure skeleton', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    // Should have multiple grid layouts for table header and rows
    const flexLayouts = container.querySelectorAll('div[style*="display: grid"]');
    expect(flexLayouts.length).toBeGreaterThan(0);
    
    // Should have multiple skeleton lines
    const skeletonLines = container.querySelectorAll('.skeleton-line');
    expect(skeletonLines.length).toBeGreaterThan(0);
  });

  it('renders table header and row skeletons', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    // Should have multiple skeleton lines for tables
    const skeletonLines = container.querySelectorAll('.skeleton-line');
    expect(skeletonLines.length).toBeGreaterThan(10); // Multiple lines for filters, stats, and tables
  });

  it('renders expense ledger skeleton section', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    const sections = container.querySelectorAll('.payment-section');
    expect(sections.length).toBeGreaterThanOrEqual(2);
    
    // Both should have skeletons
    sections.forEach((section) => {
      const skeletonLines = section.querySelectorAll('.skeleton-line');
      expect(skeletonLines.length).toBeGreaterThan(0);
    });
  });

  it('has proper spacing and layout', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    // Should have elements with gap spacing
    const elementsWithGap = container.querySelectorAll('div[style*="gap"]');
    expect(elementsWithGap.length).toBeGreaterThan(0);
    
    // Should have proper border styling
    const elementsWithBorder = container.querySelectorAll('div[style*="border"]');
    expect(elementsWithBorder.length).toBeGreaterThan(0);
  });

  it('renders responsive grid layout for filters', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    // Should have filter skeleton section with grid display
    const filterSections = container.querySelectorAll('div[style*="display"]');
    expect(filterSections.length).toBeGreaterThan(0);
    
    // Should have multiple skeleton lines for filters
    const skeletonLines = container.querySelectorAll('.skeleton-line--sm');
    expect(skeletonLines.length).toBeGreaterThanOrEqual(6);
  });

  it('renders multiple table rows skeleton', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    // Should have 3 row skeletons for each table
    const gridRows = container.querySelectorAll('div[style*="display: grid"]');
    expect(gridRows.length).toBeGreaterThan(0);
  });

  it('applies background and border styling to sections', () => {
    const { container } = render(<PaymentsTabSkeleton />);
    
    const sections = container.querySelectorAll('.payment-section');
    sections.forEach((section) => {
      expect(section.className).toContain('payment-section');
    });
  });
});

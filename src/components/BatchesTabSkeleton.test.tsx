import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BatchesTabSkeleton } from './BatchesTabSkeleton';

describe('BatchesTabSkeleton', () => {
  it('renders skeleton structure', () => {
    const { container } = render(<BatchesTabSkeleton />);
    
    // Check that main container exists
    const content = container.querySelector('.coach-profile-tab-content');
    expect(content).toBeInTheDocument();
  });

  it('renders tab header with skeleton line', () => {
    const { container } = render(<BatchesTabSkeleton />);
    
    const tabHeader = container.querySelector('.tab-header');
    expect(tabHeader).toBeInTheDocument();
    
    const skeletonLine = tabHeader?.querySelector('.skeleton-line');
    expect(skeletonLine).toBeInTheDocument();
  });

  it('renders three batch item skeletons', () => {
    const { container } = render(<BatchesTabSkeleton />);
    
    // Should have flex container for batch items with flexDirection
    const flexContainers = container.querySelectorAll('div[style*="flex"]');
    expect(flexContainers.length).toBeGreaterThan(0);
    
    // Should have multiple animated avatars (one per batch)
    const avatars = container.querySelectorAll('.animate-pulse');
    expect(avatars.length).toBeGreaterThanOrEqual(3);
  });

  it('renders batch item with avatar placeholder', () => {
    const { container } = render(<BatchesTabSkeleton />);
    
    // Should have avatar placeholders with animate-pulse class
    const avatars = container.querySelectorAll('.animate-pulse');
    expect(avatars.length).toBeGreaterThan(0);
    
    // Avatars should have size styling
    avatars.forEach((avatar) => {
      const style = (avatar as HTMLElement).getAttribute('style');
      // Check for border-radius in style (may be with hyphen or camelCase)
      expect(style).toMatch(/border-radius|borderRadius/);
    });
  });

  it('renders skeleton lines for batch info', () => {
    const { container } = render(<BatchesTabSkeleton />);
    
    const skeletonLines = container.querySelectorAll('.skeleton-line');
    expect(skeletonLines.length).toBeGreaterThan(0);
    
    // Should have different sizes
    const smLines = container.querySelectorAll('.skeleton-line--sm');
    const xsLines = container.querySelectorAll('.skeleton-line--xs');
    
    expect(smLines.length).toBeGreaterThan(0);
    expect(xsLines.length).toBeGreaterThan(0);
  });

  it('applies correct styling classes to batch items', () => {
    const { container } = render(<BatchesTabSkeleton />);
    
    // Find batch item containers - they should have border and border-radius styles
    const styledDivs = container.querySelectorAll('div[style*="border"]');
    expect(styledDivs.length).toBeGreaterThan(0);
  });

  it('renders batch list items with flex layout', () => {
    const { container } = render(<BatchesTabSkeleton />);
    
    // Should use flex layout for items
    const flexItems = container.querySelectorAll('div[style*="display: flex"]');
    expect(flexItems.length).toBeGreaterThan(0);
  });

  it('has proper gap spacing between elements', () => {
    const { container } = render(<BatchesTabSkeleton />);
    
    // Check for gap styling
    const elementsWithGap = container.querySelectorAll('div[style*="gap"]');
    expect(elementsWithGap.length).toBeGreaterThan(0);
  });
});

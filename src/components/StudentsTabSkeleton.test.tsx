import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StudentsTabSkeleton } from './StudentsTabSkeleton';

describe('StudentsTabSkeleton', () => {
  it('renders skeleton structure', () => {
    const { container } = render(<StudentsTabSkeleton />);
    
    const content = container.querySelector('.coach-profile-tab-content');
    expect(content).toBeInTheDocument();
  });

  it('renders tab header with skeleton', () => {
    const { container } = render(<StudentsTabSkeleton />);
    
    const tabHeader = container.querySelector('.tab-header');
    expect(tabHeader).toBeInTheDocument();
    
    const skeletonLine = tabHeader?.querySelector('.skeleton-line');
    expect(skeletonLine).toBeInTheDocument();
  });

  it('renders filter section skeleton', () => {
    const { container } = render(<StudentsTabSkeleton />);
    
    // Should have filter section with flex layout
    const filterSection = container.querySelector('div[style*="display: flex"]');
    expect(filterSection).toBeInTheDocument();
  });

  it('renders filter skeleton items', () => {
    const { container } = render(<StudentsTabSkeleton />);
    
    // Should have skeleton lines for filters (at least 3)
    const skeletonLines = container.querySelectorAll('.skeleton-line--sm');
    expect(skeletonLines.length).toBeGreaterThanOrEqual(3);
  });

  it('renders students grid with skeleton cards', () => {
    const { container } = render(<StudentsTabSkeleton />);
    
    // Should have students list with student-card elements
    const studentsList = container.querySelector('.students-list');
    expect(studentsList).toBeInTheDocument();
    
    // Should have student-card elements
    const studentCards = container.querySelectorAll('.student-card');
    expect(studentCards.length).toBe(4); // Default of 4 skeleton cards
  });

  it('renders student avatar placeholders', () => {
    const { container } = render(<StudentsTabSkeleton />);
    
    // Should have animate-pulse elements for avatars
    const avatars = container.querySelectorAll('.animate-pulse');
    expect(avatars.length).toBe(4); // One for each student skeleton
    
    // Avatars should have rounded styling
    avatars.forEach((avatar) => {
      const style = (avatar as HTMLElement).getAttribute('style');
      // Check for border-radius in style (may be with hyphen or camelCase)
      expect(style).toMatch(/border-radius|borderRadius/);
    });
  });

  it('renders skeleton lines in correct sizes', () => {
    const { container } = render(<StudentsTabSkeleton />);
    
    // Check for different skeleton line sizes
    const lgLines = container.querySelectorAll('.skeleton-line--lg');
    const smLines = container.querySelectorAll('.skeleton-line--sm');
    const xsLines = container.querySelectorAll('.skeleton-line--xs');
    
    expect(smLines.length).toBeGreaterThan(0);
    expect(xsLines.length).toBeGreaterThan(0);
  });

  it('applies opacity to student cards', () => {
    const { container } = render(<StudentsTabSkeleton />);
    
    const studentCards = container.querySelectorAll('.student-card');
    studentCards.forEach((card) => {
      const style = (card as HTMLElement).getAttribute('style');
      expect(style).toContain('opacity');
    });
  });

  it('has proper spacing and layout', () => {
    const { container } = render(<StudentsTabSkeleton />);
    
    // Should have gap spacing
    const elementsWithGap = container.querySelectorAll('div[style*="gap"]');
    expect(elementsWithGap.length).toBeGreaterThan(0);
    
    // Should have proper structure for responsive layout
    const studentsList = container.querySelector('.students-list');
    expect(studentsList?.className).toContain('students-list');
  });

  it('renders info section for each student skeleton', () => {
    const { container } = render(<StudentsTabSkeleton />);
    
    const studentCards = container.querySelectorAll('.student-card');
    expect(studentCards.length).toBe(4);
    
    // Each card should have flex layout with info
    studentCards.forEach((card) => {
      const flexDivs = card.querySelectorAll('div[style*="display: flex"]');
      expect(flexDivs.length).toBeGreaterThan(0);
    });
  });
});

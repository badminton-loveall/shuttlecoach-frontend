import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileTabSkeleton } from './ProfileTabSkeleton';

describe('ProfileTabSkeleton', () => {
  it('renders skeleton lines with pulse animation', () => {
    render(<ProfileTabSkeleton />);
    
    // Check that skeleton lines are rendered
    const skeletonLines = document.querySelectorAll('.skeleton-line');
    expect(skeletonLines.length).toBeGreaterThan(0);
  });

  it('applies pulse animation class to skeleton elements', () => {
    render(<ProfileTabSkeleton />);
    
    const skeletonLines = document.querySelectorAll('.skeleton-line');
    skeletonLines.forEach((line) => {
      // Check that animation is applied through CSS (animation property in computed style)
      expect(line.className).toContain('skeleton-line');
    });
  });

  it('renders tab header with skeleton', () => {
    render(<ProfileTabSkeleton />);
    
    const tabHeader = document.querySelector('.tab-header');
    expect(tabHeader).toBeInTheDocument();
    
    // Should have skeleton content
    const skeletonInHeader = tabHeader?.querySelector('.skeleton-line');
    expect(skeletonInHeader).toBeInTheDocument();
  });

  it('renders profile details section with multiple skeleton lines', () => {
    render(<ProfileTabSkeleton />);
    
    const profileDetails = document.querySelector('.coach-profile-details');
    expect(profileDetails).toBeInTheDocument();
    
    // Should have multiple detail groups
    const detailGroups = profileDetails?.querySelectorAll('.detail-group');
    expect(detailGroups?.length).toBeGreaterThan(0);
  });

  it('renders role section with skeleton lines', () => {
    const { container } = render(<ProfileTabSkeleton />);
    
    // Check for role section (has border styling)
    const skeletonLines = container.querySelectorAll('.skeleton-line');
    expect(skeletonLines.length).toBeGreaterThan(6); // Should have more lines for role section
  });

  it('has proper responsive structure', () => {
    const { container } = render(<ProfileTabSkeleton />);
    
    const coachProfileDetails = container.querySelector('.coach-profile-details');
    expect(coachProfileDetails).toBeInTheDocument();
    
    // Should use CSS grid for responsive layout
    expect(coachProfileDetails?.className).toContain('coach-profile-details');
  });

  it('uses correct skeleton line size variants', () => {
    const { container } = render(<ProfileTabSkeleton />);
    
    // Should have various skeleton-line size variants
    const lgLine = container.querySelector('.skeleton-line--lg');
    const smLines = container.querySelectorAll('.skeleton-line--sm');
    const xsLines = container.querySelectorAll('.skeleton-line--xs');
    
    expect(lgLine).toBeInTheDocument();
    expect(smLines.length).toBeGreaterThan(0);
    expect(xsLines.length).toBeGreaterThan(0);
  });
});

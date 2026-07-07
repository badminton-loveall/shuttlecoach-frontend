import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TabNavigation, type Tab } from './TabNavigation';

/**
 * TabNavigation Component Tests
 * 
 * Validates:
 * - Rendering with multiple tabs
 * - Tab switching on click
 * - Keyboard navigation with Tab key
 * - Responsive layout classes
 * - Disabled tab states
 * - Accessibility features
 * 
 * Requirements: 1.2, 1.4, 22.1, 22.3, 25.1
 */

const mockTabs: Tab[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'batches', label: 'Batches' },
  { id: 'students', label: 'Students' },
  { id: 'payments', label: 'Payments' },
];

describe('TabNavigation Component', () => {
  describe('Rendering', () => {
    it('renders all tabs with correct labels', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Batches')).toBeInTheDocument();
      expect(screen.getByText('Students')).toBeInTheDocument();
      expect(screen.getByText('Payments')).toBeInTheDocument();
    });

    it('renders exactly four tabs', () => {
      const mockOnTabChange = vi.fn();
      const { container } = render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const buttons = container.querySelectorAll('[role="tab"]');
      expect(buttons).toHaveLength(4);
    });

    it('renders with correct ARIA attributes', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const profileTab = screen.getByText('Profile').closest('[role="tab"]');
      expect(profileTab).toHaveAttribute('aria-selected', 'true');
      expect(profileTab).toHaveAttribute('aria-controls', 'tabpanel-profile');

      const batchesTab = screen.getByText('Batches').closest('[role="tab"]');
      expect(batchesTab).toHaveAttribute('aria-selected', 'false');
    });

    it('renders tablist role on container', () => {
      const mockOnTabChange = vi.fn();
      const { container } = render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toBeInTheDocument();
    });

    it('renders with custom aria label', () => {
      const mockOnTabChange = vi.fn();
      const { container } = render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
          ariaLabel="Coach detail tabs"
        />
      );

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveAttribute('aria-label', 'Coach detail tabs');
    });
  });

  describe('Tab Switching', () => {
    it('calls onTabChange with correct tab id on click', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const batchesButton = screen.getByText('Batches');
      fireEvent.click(batchesButton);

      expect(mockOnTabChange).toHaveBeenCalledWith('batches');
      expect(mockOnTabChange).toHaveBeenCalledTimes(1);
    });

    it('updates active tab styling when activeTab prop changes', () => {
      const mockOnTabChange = vi.fn();
      const { rerender } = render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      let profileTab = screen.getByText('Profile').closest('[role="tab"]');
      expect(profileTab).toHaveAttribute('aria-selected', 'true');

      rerender(
        <TabNavigation
          tabs={mockTabs}
          activeTab="batches"
          onTabChange={mockOnTabChange}
        />
      );

      profileTab = screen.getByText('Profile').closest('[role="tab"]');
      expect(profileTab).toHaveAttribute('aria-selected', 'false');

      const batchesTab = screen.getByText('Batches').closest('[role="tab"]');
      expect(batchesTab).toHaveAttribute('aria-selected', 'true');
    });

    it('applies active styling to the active tab', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const profileTab = screen.getByText('Profile').closest('[role="tab"]');
      // Active tab should have primary color classes
      expect(profileTab?.className).toMatch(/text-primary/);
      expect(profileTab?.className).toMatch(/border-primary/);
    });

    it('applies inactive styling to non-active tabs', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const batchesTab = screen.getByText('Batches').closest('[role="tab"]');
      // Inactive tab should have gray border
      expect(batchesTab?.className).toMatch(/border-gray-200/);
      expect(batchesTab?.className).toMatch(/text-gray/);
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates to next tab with Tab key', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const profileButton = screen.getByText('Profile').closest('button');
      profileButton?.focus();

      fireEvent.keyDown(profileButton!, { key: 'Tab' });

      const batchesButton = screen.getByText('Batches').closest('button');
      expect(document.activeElement).toBe(batchesButton);
    });

    it('navigates to previous tab with Shift+Tab', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const batchesButton = screen.getByText('Batches').closest('button');
      batchesButton?.focus();

      fireEvent.keyDown(batchesButton!, { key: 'Tab', shiftKey: true });

      const profileButton = screen.getByText('Profile').closest('button');
      expect(document.activeElement).toBe(profileButton);
    });

    it('wraps around to first tab when Tab is pressed on last tab', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const paymentsButton = screen.getByText('Payments').closest('button');
      paymentsButton?.focus();

      fireEvent.keyDown(paymentsButton!, { key: 'Tab' });

      const profileButton = screen.getByText('Profile').closest('button');
      expect(document.activeElement).toBe(profileButton);
    });

    it('wraps around to last tab when Shift+Tab is pressed on first tab', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const profileButton = screen.getByText('Profile').closest('button');
      profileButton?.focus();

      fireEvent.keyDown(profileButton!, { key: 'Tab', shiftKey: true });

      const paymentsButton = screen.getByText('Payments').closest('button');
      expect(document.activeElement).toBe(paymentsButton);
    });

    it('activates tab with Enter key', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const batchesButton = screen.getByText('Batches').closest('button');
      batchesButton?.focus();

      fireEvent.keyDown(batchesButton!, { key: 'Enter' });

      expect(mockOnTabChange).toHaveBeenCalledWith('batches');
    });

    it('activates tab with Space key', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const batchesButton = screen.getByText('Batches').closest('button');
      batchesButton?.focus();

      fireEvent.keyDown(batchesButton!, { key: ' ' });

      expect(mockOnTabChange).toHaveBeenCalledWith('batches');
    });

    it('skips disabled tabs during navigation', () => {
      const mockOnTabChange = vi.fn();
      const disabledTabs: Tab[] = [
        { id: 'profile', label: 'Profile' },
        { id: 'batches', label: 'Batches', disabled: true },
        { id: 'students', label: 'Students' },
        { id: 'payments', label: 'Payments' },
      ];

      render(
        <TabNavigation
          tabs={disabledTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const profileButton = screen.getByText('Profile').closest('button');
      profileButton?.focus();

      fireEvent.keyDown(profileButton!, { key: 'Tab' });

      // Should skip Batches (disabled) and focus Students
      const studentsButton = screen.getByText('Students').closest('button');
      expect(document.activeElement).toBe(studentsButton);
    });
  });

  describe('Disabled Tabs', () => {
    it('renders disabled tabs with disabled attribute', () => {
      const mockOnTabChange = vi.fn();
      const disabledTabs: Tab[] = [
        { id: 'profile', label: 'Profile' },
        { id: 'batches', label: 'Batches', disabled: true },
      ];

      render(
        <TabNavigation
          tabs={disabledTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const batchesButton = screen.getByText('Batches').closest('button');
      expect(batchesButton).toBeDisabled();
    });

    it('does not call onTabChange when clicking disabled tab', () => {
      const mockOnTabChange = vi.fn();
      const disabledTabs: Tab[] = [
        { id: 'profile', label: 'Profile' },
        { id: 'batches', label: 'Batches', disabled: true },
      ];

      render(
        <TabNavigation
          tabs={disabledTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const batchesButton = screen.getByText('Batches').closest('button');
      fireEvent.click(batchesButton!);

      expect(mockOnTabChange).not.toHaveBeenCalled();
    });

    it('applies reduced opacity to disabled tabs', () => {
      const mockOnTabChange = vi.fn();
      const disabledTabs: Tab[] = [
        { id: 'profile', label: 'Profile' },
        { id: 'batches', label: 'Batches', disabled: true },
      ];

      render(
        <TabNavigation
          tabs={disabledTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const batchesButton = screen.getByText('Batches').closest('button');
      expect(batchesButton?.className).toMatch(/disabled:opacity-50/);
    });
  });

  describe('Responsive Design', () => {
    it('applies flex-col for mobile layout', () => {
      const mockOnTabChange = vi.fn();
      const { container } = render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist?.className).toMatch(/flex-col/);
    });

    it('applies lg:flex-row for desktop layout', () => {
      const mockOnTabChange = vi.fn();
      const { container } = render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist?.className).toMatch(/lg:flex-row/);
    });

    it('applies mobile border styling (bottom border)', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const buttons = screen.getAllByRole('tab');
      buttons.forEach((button) => {
        expect(button.className).toMatch(/border-b-2/);
      });
    });

    it('applies desktop border styling (right border)', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const buttons = screen.getAllByRole('tab');
      buttons.forEach((button) => {
        expect(button.className).toMatch(/lg:border-r-2/);
      });
    });
  });

  describe('Accessibility', () => {
    it('has focus visible ring on keyboard focus', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const buttons = screen.getAllByRole('tab');
      buttons.forEach((button) => {
        expect(button.className).toMatch(/focus-visible:ring/);
        expect(button.className).toMatch(/focus-visible:outline-none/);
      });
    });

    it('has each tab with unique ID', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const profileTab = screen.getByText('Profile').closest('button');
      const batchesTab = screen.getByText('Batches').closest('button');

      expect(profileTab?.id).toBe('tab-profile');
      expect(batchesTab?.id).toBe('tab-batches');
    });

    it('updates aria-selected when tab is activated', () => {
      const mockOnTabChange = vi.fn();
      const { rerender } = render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      let profileTab = screen.getByText('Profile').closest('[role="tab"]');
      expect(profileTab).toHaveAttribute('aria-selected', 'true');

      rerender(
        <TabNavigation
          tabs={mockTabs}
          activeTab="batches"
          onTabChange={mockOnTabChange}
        />
      );

      profileTab = screen.getByText('Profile').closest('[role="tab"]');
      expect(profileTab).toHaveAttribute('aria-selected', 'false');
    });

    it('connects tabs to tab panels with aria-controls', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const profileTab = screen.getByText('Profile').closest('[role="tab"]');
      expect(profileTab).toHaveAttribute('aria-controls', 'tabpanel-profile');

      const batchesTab = screen.getByText('Batches').closest('[role="tab"]');
      expect(batchesTab).toHaveAttribute('aria-controls', 'tabpanel-batches');
    });
  });

  describe('CSS Classes', () => {
    it('accepts and applies custom className', () => {
      const mockOnTabChange = vi.fn();
      const { container } = render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
          className="custom-class"
        />
      );

      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist?.className).toMatch(/custom-class/);
    });

    it('applies hover effects on tabs', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const buttons = screen.getAllByRole('tab');
      buttons.forEach((button) => {
        expect(button.className).toMatch(/hover:/);
      });
    });

    it('applies transition effects', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const buttons = screen.getAllByRole('tab');
      buttons.forEach((button) => {
        expect(button.className).toMatch(/transition/);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty tabs array', () => {
      const mockOnTabChange = vi.fn();
      const { container } = render(
        <TabNavigation
          tabs={[]}
          activeTab=""
          onTabChange={mockOnTabChange}
        />
      );

      const buttons = container.querySelectorAll('[role="tab"]');
      expect(buttons).toHaveLength(0);
    });

    it('handles single tab', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={[{ id: 'profile', label: 'Profile' }]}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByText('Profile')).toBeInTheDocument();
      const buttons = screen.getAllByRole('tab');
      expect(buttons).toHaveLength(1);
    });

    it('handles all tabs disabled', () => {
      const mockOnTabChange = vi.fn();
      const disabledTabs: Tab[] = [
        { id: 'profile', label: 'Profile', disabled: true },
        { id: 'batches', label: 'Batches', disabled: true },
      ];

      render(
        <TabNavigation
          tabs={disabledTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const buttons = screen.getAllByRole('tab');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('handles activeTab not in tabs array', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="nonexistent"
          onTabChange={mockOnTabChange}
        />
      );

      const profileTab = screen.getByText('Profile').closest('[role="tab"]');
      expect(profileTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Integration', () => {
    it('handles rapid tab clicks', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const batchesButton = screen.getByText('Batches');
      const studentsButton = screen.getByText('Students');

      fireEvent.click(batchesButton);
      fireEvent.click(studentsButton);
      fireEvent.click(batchesButton);

      expect(mockOnTabChange).toHaveBeenCalledTimes(3);
      expect(mockOnTabChange).toHaveBeenNthCalledWith(1, 'batches');
      expect(mockOnTabChange).toHaveBeenNthCalledWith(2, 'students');
      expect(mockOnTabChange).toHaveBeenNthCalledWith(3, 'batches');
    });

    it('maintains focus after tab change', () => {
      const mockOnTabChange = vi.fn();
      render(
        <TabNavigation
          tabs={mockTabs}
          activeTab="profile"
          onTabChange={mockOnTabChange}
        />
      );

      const profileButton = screen.getByText('Profile').closest('button');
      profileButton?.focus();

      fireEvent.keyDown(profileButton!, { key: 'Tab' });

      const batchesButton = screen.getByText('Batches').closest('button');
      expect(document.activeElement).toBe(batchesButton);
    });
  });
});

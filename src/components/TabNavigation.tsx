import React, { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Tab object structure
 */
export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

/**
 * Props for TabNavigation component
 */
export interface TabNavigationProps {
  /** Array of tab objects with id, label, and optional disabled flag */
  tabs: Tab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
  /** Optional CSS class name for additional styling */
  className?: string;
  /** Optional ARIA label for the tab list */
  ariaLabel?: string;
}

/**
 * TabNavigation Component
 * 
 * Renders a tab navigation bar with keyboard navigation support.
 * Supports both vertical (mobile) and horizontal (desktop) layouts.
 * 
 * Features:
 * - Keyboard navigation with Tab key
 * - Active/inactive tab styling
 * - Responsive design: vertical stack on mobile (<1024px), horizontal on lg (1024px+)
 * - Accessibility: ARIA labels, semantic HTML, keyboard focus indicators
 * - Disabled tab state support
 * 
 * Requirements: 1.2, 1.4, 22.1, 22.3, 25.1
 * 
 * @example
 * ```tsx
 * const tabs = [
 *   { id: 'profile', label: 'Profile' },
 *   { id: 'batches', label: 'Batches' },
 *   { id: 'students', label: 'Students' },
 *   { id: 'payments', label: 'Payments' }
 * ];
 * 
 * <TabNavigation 
 *   tabs={tabs}
 *   activeTab="profile"
 *   onTabChange={(tabId) => setActiveTab(tabId)}
 * />
 * ```
 */
export const TabNavigation = React.forwardRef<HTMLDivElement, TabNavigationProps>(
  ({ tabs, activeTab, onTabChange, className, ariaLabel }, ref) => {
    const [focusedIndex, setFocusedIndex] = useState(0);

    /**
     * Handle tab button click
     */
    const handleTabClick = (tabId: string, disabled?: boolean) => {
      if (!disabled) {
        onTabChange(tabId);
      }
    };

    /**
     * Handle keyboard navigation
     * Tab/Shift+Tab moves focus between tabs
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (e.key === 'Tab') {
        e.preventDefault();

        let nextIndex = index;
        if (e.shiftKey) {
          // Shift+Tab moves backward
          nextIndex = index === 0 ? tabs.length - 1 : index - 1;
        } else {
          // Tab moves forward
          nextIndex = index === tabs.length - 1 ? 0 : index + 1;
        }

        // Skip disabled tabs
        while (tabs[nextIndex]?.disabled) {
          if (e.shiftKey) {
            nextIndex = nextIndex === 0 ? tabs.length - 1 : nextIndex - 1;
          } else {
            nextIndex = nextIndex === tabs.length - 1 ? 0 : nextIndex + 1;
          }
        }

        setFocusedIndex(nextIndex);
        const button = document.querySelector(
          `[data-tab-index="${nextIndex}"]`
        ) as HTMLButtonElement;
        button?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const tab = tabs[index];
        if (!tab.disabled) {
          onTabChange(tab.id);
        }
      }
    };

    return (
      <div
        ref={ref}
        role="tablist"
        aria-label={ariaLabel || 'Tab navigation'}
        className={cn(
          'flex flex-col gap-2 lg:flex-row lg:gap-0',
          className
        )}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            data-tab-index={index}
            disabled={tab.disabled}
            onClick={() => handleTabClick(tab.id, tab.disabled)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            aria-disabled={tab.disabled}
            className={cn(
              // Base styles
              'py-3 px-4 lg:px-6 font-semibold text-sm transition-all',
              'border-b-2 lg:border-b-0 lg:border-r-2',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'hover:bg-slate-50 lg:hover:bg-transparent',
              // Active state
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5 lg:bg-transparent'
                : 'border-gray-200 text-gray-700 hover:text-gray-900',
              // Disabled state
              tab.disabled && 'pointer-events-none'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }
);

TabNavigation.displayName = 'TabNavigation';

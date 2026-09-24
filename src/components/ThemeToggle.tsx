import React from 'react';
import { useTheme, type ThemePreference } from '../contexts/ThemeContext';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/**
 * ThemeToggle
 * 3-way Light / Dark / System segmented control. Lets a user override the
 * OS `prefers-color-scheme` explicitly (and switch back to following it),
 * which also makes it a quick way to test both themes on one device.
 */
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      style={{
        display: 'inline-flex',
        padding: '2px',
        gap: '2px',
        backgroundColor: 'var(--surface-hover)',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border-default)',
      }}
    >
      {OPTIONS.map((option) => {
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(option.value)}
            style={{
              padding: '3px 10px',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              fontSize: 'var(--font-xs)',
              lineHeight: 1.4,
              fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-medium)',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, color 0.15s ease',
              backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
              color: isActive ? 'var(--on-primary)' : 'var(--text-secondary)',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;

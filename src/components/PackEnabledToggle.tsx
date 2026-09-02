import React from 'react';

/**
 * PackEnabledToggle Component
 * Generic switch used to enable/disable a marketplace pack (a Drill Set the
 * center owns/has adopted, or the synthetic Official Drill Pack). Visuals
 * match the existing FeeAccessToggle pattern (pill button, sliding knob).
 */

export interface PackEnabledToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const PackEnabledToggle: React.FC<PackEnabledToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
}) => {
  return (
    <div className="pack-enabled-toggle" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm, 8px)' }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ? `${label} toggle` : 'Toggle pack enabled'}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="pack-enabled-toggle__switch"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: '40px',
          height: '22px',
          borderRadius: '11px',
          border: 'none',
          cursor: disabled ? 'wait' : 'pointer',
          backgroundColor: checked ? 'var(--color-primary, #4f46e5)' : 'var(--border-default, #d1d5db)',
          opacity: disabled ? 0.6 : 1,
          transition: 'background-color 0.2s ease',
          padding: 0,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: checked ? '20px' : '2px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
            transition: 'left 0.2s ease',
          }}
        />
      </button>
      {label && (
        <span className="text-xs" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
    </div>
  );
};

export default PackEnabledToggle;

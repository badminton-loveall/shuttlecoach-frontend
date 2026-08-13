import React from 'react';

export interface AttendanceSubmitFooterProps {
  allMarked: boolean;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
}

/**
 * AttendanceSubmitFooter Component
 * Sticky footer bar for the attendance block with submit button and error display.
 * Button is disabled until all students are marked or while submission is in progress.
 *
 * Validates: Requirements 4.5, 4.7
 */
export const AttendanceSubmitFooter: React.FC<AttendanceSubmitFooterProps> = ({
  allMarked,
  submitting,
  error,
  onSubmit,
}) => {
  const isDisabled = !allMarked || submitting;

  const getButtonText = (): string => {
    if (submitting) return 'Submitting...';
    if (!allMarked) return 'Mark all students first';
    return 'Submit Attendance';
  };

  return (
    <div style={footerStyle}>
      {error && (
        <span style={errorStyle} role="alert">
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        style={isDisabled ? disabledButtonStyle : activeButtonStyle}
      >
        {getButtonText()}
      </button>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const footerStyle: React.CSSProperties = {
  position: 'sticky',
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  borderTop: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--card))',
  gap: '0.75rem',
};

const errorStyle: React.CSSProperties = {
  color: 'hsl(var(--destructive))',
  fontSize: '0.8rem',
  fontWeight: 500,
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const baseButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: 'var(--radius)',
  border: 'none',
  fontWeight: 600,
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  transition: 'opacity 0.15s ease',
};

const activeButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  backgroundColor: 'hsl(var(--primary))',
  color: 'hsl(var(--primary-foreground))',
  cursor: 'pointer',
};

const disabledButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  backgroundColor: 'hsl(var(--muted))',
  color: 'hsl(var(--muted-foreground))',
  cursor: 'not-allowed',
  opacity: 0.7,
};

export default AttendanceSubmitFooter;

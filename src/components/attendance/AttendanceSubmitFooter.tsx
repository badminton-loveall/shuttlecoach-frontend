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
        className="btn btn-secondary"
        onClick={onSubmit}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        style={buttonStyle}
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
  padding: 'var(--space-sm) var(--space-md)',
  borderTop: '1px solid var(--border-default)',
  backgroundColor: 'var(--surface-card)',
  gap: 'var(--space-sm)',
};

const errorStyle: React.CSSProperties = {
  color: 'var(--color-danger)',
  fontSize: 'var(--font-small)',
  fontWeight: 500,
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const buttonStyle: React.CSSProperties = {
  whiteSpace: 'nowrap',
};

export default AttendanceSubmitFooter;

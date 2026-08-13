import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttendanceSubmitFooter } from './AttendanceSubmitFooter';

describe('AttendanceSubmitFooter', () => {
  it('renders submit button with "Submit Attendance" when all marked', () => {
    render(
      <AttendanceSubmitFooter
        allMarked={true}
        submitting={false}
        error={null}
        onSubmit={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /submit attendance/i })).toBeInTheDocument();
  });

  it('shows "Mark all students first" when not all marked', () => {
    render(
      <AttendanceSubmitFooter
        allMarked={false}
        submitting={false}
        error={null}
        onSubmit={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /mark all students first/i })).toBeInTheDocument();
  });

  it('shows "Submitting..." when submitting', () => {
    render(
      <AttendanceSubmitFooter
        allMarked={true}
        submitting={true}
        error={null}
        onSubmit={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument();
  });

  it('disables button when allMarked is false', () => {
    render(
      <AttendanceSubmitFooter
        allMarked={false}
        submitting={false}
        error={null}
        onSubmit={() => {}}
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables button when submitting', () => {
    render(
      <AttendanceSubmitFooter
        allMarked={true}
        submitting={true}
        error={null}
        onSubmit={() => {}}
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('enables button when allMarked and not submitting', () => {
    render(
      <AttendanceSubmitFooter
        allMarked={true}
        submitting={false}
        error={null}
        onSubmit={() => {}}
      />
    );
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('calls onSubmit when button is clicked', () => {
    const onSubmit = vi.fn();
    render(
      <AttendanceSubmitFooter
        allMarked={true}
        submitting={false}
        error={null}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('displays error message when error is provided', () => {
    render(
      <AttendanceSubmitFooter
        allMarked={true}
        submitting={false}
        error="Network error: submission failed"
        onSubmit={() => {}}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Network error: submission failed');
  });

  it('does not render error when error is null', () => {
    render(
      <AttendanceSubmitFooter
        allMarked={true}
        submitting={false}
        error={null}
        onSubmit={() => {}}
      />
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

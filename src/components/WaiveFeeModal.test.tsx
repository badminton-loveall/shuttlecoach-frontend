import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WaiveFeeModal } from './WaiveFeeModal';

describe('WaiveFeeModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  it('should not render when isOpen is false', () => {
    render(
      <WaiveFeeModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    expect(screen.queryByText('Waive Fee')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <WaiveFeeModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    expect(screen.getByRole('heading', { name: 'Waive Fee' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Reason for Waiving Fee/i)).toBeInTheDocument();
  });

  it('should display student name and fee amount when provided', () => {
    render(
      <WaiveFeeModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        studentName="John Doe"
        feeAmount={5000}
      />
    );

    expect(screen.getByText('Student: John Doe')).toBeInTheDocument();
    expect(screen.getByText('Amount: ₹5,000')).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(
      <WaiveFeeModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const { container } = render(
      <WaiveFeeModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const backdrop = container.querySelector('.modal-overlay');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should have submit button disabled when reason is empty', () => {
    render(
      <WaiveFeeModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const submitButton = screen.getByRole('button', { name: 'Waive Fee' });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when reason is entered', () => {
    render(
      <WaiveFeeModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const reasonTextarea = screen.getByLabelText(/Reason for Waiving Fee/i);
    fireEvent.change(reasonTextarea, { target: { value: 'Financial hardship' } });

    const submitButton = screen.getByRole('button', { name: 'Waive Fee' });
    expect(submitButton).not.toBeDisabled();
  });

  it('should call onSubmit with reason when form is submitted', async () => {
    render(
      <WaiveFeeModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const reasonTextarea = screen.getByLabelText(/Reason for Waiving Fee/i);
    fireEvent.change(reasonTextarea, { target: { value: 'Financial hardship' } });

    const submitButton = screen.getByRole('button', { name: 'Waive Fee' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Financial hardship');
    });
  });

  it('should trim whitespace from reason before submitting', async () => {
    render(
      <WaiveFeeModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const reasonTextarea = screen.getByLabelText(/Reason for Waiving Fee/i);
    fireEvent.change(reasonTextarea, { target: { value: '  Financial hardship  ' } });

    const submitButton = screen.getByRole('button', { name: 'Waive Fee' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Financial hardship');
    });
  });

  it('should reset form when modal is reopened', () => {
    const { rerender } = render(
      <WaiveFeeModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const reasonTextarea = screen.getByLabelText(/Reason for Waiving Fee/i);
    fireEvent.change(reasonTextarea, { target: { value: 'Test reason' } });

    // Close modal
    rerender(
      <WaiveFeeModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    // Reopen modal
    rerender(
      <WaiveFeeModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const reopenedTextarea = screen.getByLabelText(/Reason for Waiving Fee/i);
    expect(reopenedTextarea).toHaveValue('');
  });

  it('should show loading state when submitting', async () => {
    mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(
      <WaiveFeeModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const reasonTextarea = screen.getByLabelText(/Reason for Waiving Fee/i);
    fireEvent.change(reasonTextarea, { target: { value: 'Test reason' } });

    const submitButton = screen.getByRole('button', { name: 'Waive Fee' });
    fireEvent.click(submitButton);

    expect(screen.getByText('Waiving...')).toBeInTheDocument();
  });

  it('should not close modal when clicking inside modal content', () => {
    render(
      <WaiveFeeModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );

    const modalHeading = screen.getByRole('heading', { name: 'Waive Fee' });
    if (modalHeading) {
      fireEvent.click(modalHeading);
    }

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});

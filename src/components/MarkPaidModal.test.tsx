import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarkPaidModal, { type PaymentFormData } from './MarkPaidModal';

describe('MarkPaidModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    studentName: 'John Doe',
    feeAmount: 3000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<MarkPaidModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Mark Fee as Paid')).not.toBeInTheDocument();
  });

  it('should render modal with student name and fee amount', () => {
    render(<MarkPaidModal {...defaultProps} />);
    
    expect(screen.getByText('Mark Fee as Paid')).toBeInTheDocument();
    expect(screen.getByText('Student: John Doe')).toBeInTheDocument();
    expect(screen.getByText('Amount: ₹3,000')).toBeInTheDocument();
  });

  it('should initialize with default values', () => {
    render(<MarkPaidModal {...defaultProps} />);
    
    // Cash should be selected by default
    const cashButton = screen.getByText('Cash').closest('button');
    expect(cashButton).toHaveClass('border-primary');
    
    // Paid date should be set to today
    const dateInput = screen.getByLabelText(/Paid Date/i) as HTMLInputElement;
    const today = new Date().toISOString().split('T')[0];
    expect(dateInput.value).toBe(today);
  });

  it('should allow selecting different payment methods', () => {
    render(<MarkPaidModal {...defaultProps} />);
    
    // Click UPI button
    const upiButton = screen.getByText('UPI');
    fireEvent.click(upiButton);
    
    expect(upiButton.closest('button')).toHaveClass('border-primary');
    
    // Click Bank button
    const bankButton = screen.getByText('Bank');
    fireEvent.click(bankButton);
    
    expect(bankButton.closest('button')).toHaveClass('border-primary');
  });

  it('should allow entering transaction reference', () => {
    render(<MarkPaidModal {...defaultProps} />);
    
    const transactionInput = screen.getByLabelText(/Transaction Reference/i) as HTMLInputElement;
    fireEvent.change(transactionInput, { target: { value: 'UPI-123456' } });
    
    expect(transactionInput.value).toBe('UPI-123456');
  });

  it('should allow entering notes', () => {
    render(<MarkPaidModal {...defaultProps} />);
    
    const notesTextarea = screen.getByLabelText(/Notes/i) as HTMLTextAreaElement;
    fireEvent.change(notesTextarea, { target: { value: 'Paid in person' } });
    
    expect(notesTextarea.value).toBe('Paid in person');
  });

  it('should call onSubmit with correct data when form is submitted', async () => {
    render(<MarkPaidModal {...defaultProps} />);
    
    // Select UPI
    const upiButton = screen.getByText('UPI');
    fireEvent.click(upiButton);
    
    // Enter transaction reference
    const transactionInput = screen.getByLabelText(/Transaction Reference/i);
    fireEvent.change(transactionInput, { target: { value: 'UPI-123456' } });
    
    // Enter notes
    const notesTextarea = screen.getByLabelText(/Notes/i);
    fireEvent.change(notesTextarea, { target: { value: 'Payment received' } });
    
    // Submit form
    const submitButton = screen.getByText('Mark as Paid');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'UPI',
          transactionRef: 'UPI-123456',
          notes: 'Payment received',
        })
      );
    });
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(<MarkPaidModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when backdrop is clicked', () => {
    render(<MarkPaidModal {...defaultProps} />);
    
    const backdrop = screen.getByText('Mark Fee as Paid').closest('.fixed')?.previousSibling;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should disable submit button when submitting', async () => {
    const slowOnSubmit = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
    
    render(<MarkPaidModal {...defaultProps} onSubmit={slowOnSubmit} />);
    
    const submitButton = screen.getByText('Mark as Paid') as HTMLButtonElement;
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  it('should not submit empty optional fields', async () => {
    render(<MarkPaidModal {...defaultProps} />);
    
    // Submit form without filling optional fields
    const submitButton = screen.getByText('Mark as Paid');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'CASH',
          transactionRef: undefined,
          notes: undefined,
        })
      );
    });
  });

  it('should set max date to today for paid date input', () => {
    render(<MarkPaidModal {...defaultProps} />);
    
    const dateInput = screen.getByLabelText(/Paid Date/i) as HTMLInputElement;
    const today = new Date().toISOString().split('T')[0];
    
    expect(dateInput.max).toBe(today);
  });

  it('should reset form when modal is reopened', () => {
    const { rerender } = render(<MarkPaidModal {...defaultProps} isOpen={false} />);
    
    // Open modal
    rerender(<MarkPaidModal {...defaultProps} isOpen={true} />);
    
    // Enter some data
    const transactionInput = screen.getByLabelText(/Transaction Reference/i) as HTMLInputElement;
    fireEvent.change(transactionInput, { target: { value: 'TEST-123' } });
    expect(transactionInput.value).toBe('TEST-123');
    
    // Close and reopen
    rerender(<MarkPaidModal {...defaultProps} isOpen={false} />);
    rerender(<MarkPaidModal {...defaultProps} isOpen={true} />);
    
    // Form should be reset
    const resetInput = screen.getByLabelText(/Transaction Reference/i) as HTMLInputElement;
    expect(resetInput.value).toBe('');
  });
});

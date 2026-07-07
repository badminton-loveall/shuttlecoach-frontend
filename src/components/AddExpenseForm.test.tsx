import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddExpenseForm } from './AddExpenseForm';

describe('AddExpenseForm', () => {
  const mockOnSubmit = vi.fn();
  const defaultProps = {
    coachId: 'coach-123',
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('Rendering', () => {
    it('renders all required form fields', () => {
      render(<AddExpenseForm {...defaultProps} />);

      expect(screen.getByLabelText(/expense type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^description/i)).toBeInTheDocument();
    });

    it('renders all expense type options', () => {
      render(<AddExpenseForm {...defaultProps} />);

      const typeSelect = screen.getByLabelText(/expense type/i) as HTMLSelectElement;
      const options = Array.from(typeSelect.options).map(opt => opt.value);

      expect(options).toContain('SHUTTLE');
      expect(options).toContain('SUPPLIES');
      expect(options).toContain('TRAVEL');
      expect(options).toContain('OTHER');
    });

    it('renders Save Expense and Cancel buttons', () => {
      render(<AddExpenseForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /save expense/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('sets date input to today by default', () => {
      render(<AddExpenseForm {...defaultProps} />);

      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const dateInput = screen.getByLabelText(/^date/i) as HTMLInputElement;
      expect(dateInput.value).toBe(todayString);
    });

    it('sets default expense type to SHUTTLE', () => {
      render(<AddExpenseForm {...defaultProps} />);

      const typeSelect = screen.getByLabelText(/expense type/i) as HTMLSelectElement;
      expect(typeSelect.value).toBe('SHUTTLE');
    });
  });

  describe('Form Validation', () => {
    it('shows error for amount <= 0', async () => {
      render(<AddExpenseForm {...defaultProps} />);

      const submitBtn = screen.getByRole('button', { name: /save expense/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('shows error for empty description', async () => {
      render(<AddExpenseForm {...defaultProps} />);

      const amountInput = screen.getByLabelText(/^amount/i);
      const submitBtn = screen.getByRole('button', { name: /save expense/i });

      fireEvent.change(amountInput, { target: { value: '100' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      });
    });

    it('allows submission with valid data', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      render(<AddExpenseForm {...defaultProps} />);

      const typeSelect = screen.getByLabelText(/expense type/i);
      const amountInput = screen.getByLabelText(/^amount/i);
      const descriptionInput = screen.getByLabelText(/^description/i);
      const submitBtn = screen.getByRole('button', { name: /save expense/i });

      fireEvent.change(typeSelect, { target: { value: 'SUPPLIES' } });
      fireEvent.change(amountInput, { target: { value: '250.50' } });
      fireEvent.change(descriptionInput, { target: { value: 'Training materials' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('clears error message when user fixes field', async () => {
      render(<AddExpenseForm {...defaultProps} />);

      const amountInput = screen.getByLabelText(/^amount/i);
      const submitBtn = screen.getByRole('button', { name: /save expense/i });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
      });

      fireEvent.change(amountInput, { target: { value: '100' } });
      expect(screen.queryByText(/amount must be greater than 0/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with correct expense data', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      render(<AddExpenseForm {...defaultProps} />);

      const typeSelect = screen.getByLabelText(/expense type/i);
      const amountInput = screen.getByLabelText(/^amount/i);
      const descriptionInput = screen.getByLabelText(/^description/i);
      const submitBtn = screen.getByRole('button', { name: /save expense/i });

      fireEvent.change(typeSelect, { target: { value: 'TRAVEL' } });
      fireEvent.change(amountInput, { target: { value: '500' } });
      fireEvent.change(descriptionInput, { target: { value: 'Team travel' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            coachId: 'coach-123',
            type: 'TRAVEL',
            amount: 500,
            description: 'Team travel',
            date: expect.any(Date),
          })
        );
      });
    });

    it('clears form after successful submission', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      render(<AddExpenseForm {...defaultProps} />);

      const typeSelect = screen.getByLabelText(/expense type/i) as HTMLSelectElement;
      const amountInput = screen.getByLabelText(/^amount/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/^description/i) as HTMLTextAreaElement;
      const submitBtn = screen.getByRole('button', { name: /save expense/i });

      fireEvent.change(typeSelect, { target: { value: 'OTHER' } });
      fireEvent.change(amountInput, { target: { value: '150' } });
      fireEvent.change(descriptionInput, { target: { value: 'Miscellaneous' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(typeSelect.value).toBe('SHUTTLE');
        expect(amountInput.value).toBe('');
        expect(descriptionInput.value).toBe('');
      });
    });

    it('shows error when submission fails', async () => {
      mockOnSubmit.mockRejectedValueOnce(new Error('API error'));
      render(<AddExpenseForm {...defaultProps} />);

      const amountInput = screen.getByLabelText(/^amount/i);
      const descriptionInput = screen.getByLabelText(/^description/i);
      const submitBtn = screen.getByRole('button', { name: /save expense/i });

      fireEvent.change(amountInput, { target: { value: '100' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/API error/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      mockOnSubmit.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 200))
      );
      render(<AddExpenseForm {...defaultProps} />);

      const amountInput = screen.getByLabelText(/^amount/i);
      const descriptionInput = screen.getByLabelText(/^description/i);
      const submitBtn = screen.getByRole('button', { name: /save expense/i });

      fireEvent.change(amountInput, { target: { value: '100' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test' } });

      fireEvent.click(submitBtn);

      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save expense/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Cancel', () => {
    it('clears form when cancel is clicked', async () => {
      render(<AddExpenseForm {...defaultProps} />);

      const typeSelect = screen.getByLabelText(/expense type/i) as HTMLSelectElement;
      const amountInput = screen.getByLabelText(/^amount/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/^description/i) as HTMLTextAreaElement;
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });

      fireEvent.change(typeSelect, { target: { value: 'SUPPLIES' } });
      fireEvent.change(amountInput, { target: { value: '999' } });
      fireEvent.change(descriptionInput, { target: { value: 'Some description' } });

      fireEvent.click(cancelBtn);

      expect(typeSelect.value).toBe('SHUTTLE');
      expect(amountInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
    });

    it('clears error messages when cancel is clicked', async () => {
      render(<AddExpenseForm {...defaultProps} />);

      const submitBtn = screen.getByRole('button', { name: /save expense/i });
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
      });

      fireEvent.click(cancelBtn);

      expect(screen.queryByText(/amount must be greater than 0/i)).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables all inputs when isLoading is true', () => {
      render(<AddExpenseForm {...defaultProps} isLoading={true} />);

      expect(screen.getByLabelText(/expense type/i)).toBeDisabled();
      expect(screen.getByLabelText(/^amount/i)).toBeDisabled();
      expect(screen.getByLabelText(/^date/i)).toBeDisabled();
      expect(screen.getByLabelText(/^description/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('labels are associated with inputs', () => {
      render(<AddExpenseForm {...defaultProps} />);

      expect(screen.getByLabelText(/expense type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^description/i)).toBeInTheDocument();
    });

    it('renders required field indicators', () => {
      render(<AddExpenseForm {...defaultProps} />);

      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThanOrEqual(4);
    });
  });
});


describe('AddExpenseForm - Edit Mode', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const mockExpense = {
    id: 'exp-123',
    coachId: 'coach-123',
    type: 'SHUTTLE' as const,
    amount: 500,
    date: new Date('2026-01-15'),
    description: 'Shuttle for tournament',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    createdBy: 'admin-user',
  };

  const editModeProps = {
    coachId: 'coach-123',
    onSubmit: mockOnSubmit,
    isEditing: true,
    initialExpense: mockExpense,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  describe('Edit Mode - Rendering', () => {
    it('pre-populates form with initial expense data', () => {
      render(<AddExpenseForm {...editModeProps} />);

      const typeSelect = screen.getByLabelText(/expense type/i) as HTMLSelectElement;
      const amountInput = screen.getByLabelText(/^amount/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/^description/i) as HTMLTextAreaElement;

      expect(typeSelect.value).toBe('SHUTTLE');
      expect(amountInput.value).toBe('500');
      expect(descriptionInput.value).toBe('Shuttle for tournament');
    });

    it('sets date input to pre-existing expense date', () => {
      render(<AddExpenseForm {...editModeProps} />);

      const dateInput = screen.getByLabelText(/^date/i) as HTMLInputElement;
      expect(dateInput.value).toBe('2026-01-15');
    });

    it('shows Update Expense button in edit mode', () => {
      render(<AddExpenseForm {...editModeProps} />);

      expect(screen.getByRole('button', { name: /update expense/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^save expense$/i })).not.toBeInTheDocument();
    });

    it('shows Updating state during submission', async () => {
      mockOnSubmit.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 200))
      );
      render(<AddExpenseForm {...editModeProps} />);

      const submitBtn = screen.getByRole('button', { name: /update expense/i });
      fireEvent.click(submitBtn);

      expect(screen.getByRole('button', { name: /updating/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update expense/i })).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode - Form Submission', () => {
    it('submits updated expense data', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      render(<AddExpenseForm {...editModeProps} />);

      const amountInput = screen.getByLabelText(/^amount/i);
      const descriptionInput = screen.getByLabelText(/^description/i);
      const submitBtn = screen.getByRole('button', { name: /update expense/i });

      fireEvent.change(amountInput, { target: { value: '750' } });
      fireEvent.change(descriptionInput, { target: { value: 'Updated shuttle cost' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            coachId: 'coach-123',
            type: 'SHUTTLE',
            amount: 750,
            description: 'Updated shuttle cost',
            date: expect.any(Date),
          })
        );
      });
    });

    it('allows editing of expense type', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      render(<AddExpenseForm {...editModeProps} />);

      const typeSelect = screen.getByLabelText(/expense type/i);
      const submitBtn = screen.getByRole('button', { name: /update expense/i });

      fireEvent.change(typeSelect, { target: { value: 'TRAVEL' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'TRAVEL',
          })
        );
      });
    });

    it('allows editing of expense amount', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      render(<AddExpenseForm {...editModeProps} />);

      const amountInput = screen.getByLabelText(/^amount/i);
      const submitBtn = screen.getByRole('button', { name: /update expense/i });

      fireEvent.change(amountInput, { target: { value: '1000' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 1000,
          })
        );
      });
    });

    it('allows editing of expense date', async () => {
      mockOnSubmit.mockResolvedValueOnce(undefined);
      render(<AddExpenseForm {...editModeProps} />);

      const dateInput = screen.getByLabelText(/^date/i);
      const submitBtn = screen.getByRole('button', { name: /update expense/i });

      fireEvent.change(dateInput, { target: { value: '2026-01-20' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            date: expect.any(Date),
          })
        );
      });
    });

    it('validates updated form data before submission', async () => {
      render(<AddExpenseForm {...editModeProps} />);

      const amountInput = screen.getByLabelText(/^amount/i);
      const submitBtn = screen.getByRole('button', { name: /update expense/i });

      // Change to invalid value (0 or less)
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode - Cancel', () => {
    it('calls onCancel when cancel is clicked', () => {
      render(<AddExpenseForm {...editModeProps} />);

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('resets to initial expense data when cancel is clicked', () => {
      render(<AddExpenseForm {...editModeProps} />);

      const amountInput = screen.getByLabelText(/^amount/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/^description/i) as HTMLTextAreaElement;
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });

      fireEvent.change(amountInput, { target: { value: '999' } });
      fireEvent.change(descriptionInput, { target: { value: 'Different description' } });

      fireEvent.click(cancelBtn);

      expect(amountInput.value).toBe('500');
      expect(descriptionInput.value).toBe('Shuttle for tournament');
    });

    it('preserves initial values after failed submission', async () => {
      mockOnSubmit.mockRejectedValueOnce(new Error('Update failed'));
      render(<AddExpenseForm {...editModeProps} />);

      const amountInput = screen.getByLabelText(/^amount/i) as HTMLInputElement;
      const submitBtn = screen.getByRole('button', { name: /update expense/i });

      fireEvent.change(amountInput, { target: { value: '999' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
      });

      expect(amountInput.value).toBe('999'); // Changed value is preserved
    });
  });

  describe('Edit Mode - Create Mode Validation', () => {
    it('preserves initial values after validation failure', async () => {
      render(<AddExpenseForm {...editModeProps} />);

      const descriptionInput = screen.getByLabelText(/^description/i) as HTMLTextAreaElement;
      const submitBtn = screen.getByRole('button', { name: /update expense/i });

      // Initially has description
      expect(descriptionInput.value).toBe('Shuttle for tournament');

      // Try to clear description (should fail validation)
      fireEvent.change(descriptionInput, { target: { value: '' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      });

      // Value should be empty (user changed it)
      expect(descriptionInput.value).toBe('');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddCoachModal, { type CoachFormData } from './AddCoachModal';

describe('AddCoachModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <AddCoachModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all form fields when isOpen is true', () => {
    render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByRole('heading', { name: 'Add Coach' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Specialization/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Profile Photo URL/)).toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Add Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates username minimum length', async () => {
    render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const usernameInput = screen.getByLabelText(/Username/);
    fireEvent.change(usernameInput, { target: { value: 'ab' } });

    const submitButton = screen.getByRole('button', { name: /Add Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('validates password minimum length', async () => {
    render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const passwordInput = screen.getByLabelText(/Password/);
    fireEvent.change(passwordInput, { target: { value: '12345' } });

    const submitButton = screen.getByRole('button', { name: /Add Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const nameInput = screen.getByLabelText(/Name/);
    const usernameInput = screen.getByLabelText(/Username/);
    const passwordInput = screen.getByLabelText(/Password/);
    const emailInput = screen.getByLabelText(/Email/);

    // Fill required fields to ensure they don't block validation
    fireEvent.change(nameInput, { target: { value: 'Test Coach' } });
    fireEvent.change(usernameInput, { target: { value: 'testcoach' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Fill invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /Add Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: 'Test Coach' },
    });
    fireEvent.change(screen.getByLabelText(/Username/), {
      target: { value: 'testcoach' },
    });
    fireEvent.change(screen.getByLabelText(/Password/), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByRole('button', { name: /Add Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Coach',
        username: 'testcoach',
        password: 'password123',
        email: undefined,
        specialization: undefined,
        profilePhoto: undefined,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('submits form with all fields filled', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill in all fields
    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: 'Test Coach' },
    });
    fireEvent.change(screen.getByLabelText(/Username/), {
      target: { value: 'testcoach' },
    });
    fireEvent.change(screen.getByLabelText(/Password/), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Specialization/), {
      target: { value: 'Singles Training' },
    });
    fireEvent.change(screen.getByLabelText(/Profile Photo URL/), {
      target: { value: 'https://example.com/photo.jpg' },
    });

    const submitButton = screen.getByRole('button', { name: /Add Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Coach',
        username: 'testcoach',
        password: 'password123',
        email: 'test@example.com',
        specialization: 'Singles Training',
        profilePhoto: 'https://example.com/photo.jpg',
      });
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const backdrop = screen.getByRole('button', { name: /Add Coach/i }).closest('.fixed')?.previousSibling as HTMLElement;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('disables buttons while submitting', async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: 'Test Coach' },
    });
    fireEvent.change(screen.getByLabelText(/Username/), {
      target: { value: 'testcoach' },
    });
    fireEvent.change(screen.getByLabelText(/Password/), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByRole('button', { name: /Add Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
    });
  });

  it('resets form when modal reopens', () => {
    const { rerender } = render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill in fields
    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: 'Test Coach' },
    });
    fireEvent.change(screen.getByLabelText(/Username/), {
      target: { value: 'testcoach' },
    });

    // Close modal
    rerender(
      <AddCoachModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Reopen modal
    rerender(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Check fields are reset
    expect(screen.getByLabelText<HTMLInputElement>(/Name/).value).toBe('');
    expect(screen.getByLabelText<HTMLInputElement>(/Username/).value).toBe('');
    expect(screen.getByLabelText<HTMLInputElement>(/Password/).value).toBe('');
  });

  it('shows error message when submit fails', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: 'Test Coach' },
    });
    fireEvent.change(screen.getByLabelText(/Username/), {
      target: { value: 'testcoach' },
    });
    fireEvent.change(screen.getByLabelText(/Password/), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByRole('button', { name: /Add Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to add coach. Please try again.')).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('trims whitespace from input values', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(
      <AddCoachModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill in fields with extra whitespace
    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: '  Test Coach  ' },
    });
    fireEvent.change(screen.getByLabelText(/Username/), {
      target: { value: '  testcoach  ' },
    });
    fireEvent.change(screen.getByLabelText(/Password/), {
      target: { value: '  password123  ' },
    });
    fireEvent.change(screen.getByLabelText(/Specialization/), {
      target: { value: '  Singles Training  ' },
    });

    const submitButton = screen.getByRole('button', { name: /Add Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Coach',
        username: 'testcoach',
        password: 'password123',
        email: undefined,
        specialization: 'Singles Training',
        profilePhoto: undefined,
      });
    });
  });
});

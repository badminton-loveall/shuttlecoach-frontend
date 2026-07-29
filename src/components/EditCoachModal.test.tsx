import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditCoachModal, { type EditCoachFormData } from './EditCoachModal';
import type { User } from '../types';

describe('EditCoachModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockCoach: User = {
    id: 'coach-1',
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    role: 'assistant_coach',
    specialization: 'Singles Training',
    profilePhoto: 'https://example.com/photo.jpg',
  } as User;

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <EditCoachModal
        isOpen={false}
        coach={mockCoach}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when coach is null', () => {
    const { container } = render(
      <EditCoachModal
        isOpen={true}
        coach={null}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all form fields when isOpen is true with coach data', () => {
    render(
      <EditCoachModal
        isOpen={true}
        coach={mockCoach}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Edit Assistant Coach')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Specialization/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Profile Photo URL/)).toBeInTheDocument();
  });

  it('pre-fills form with existing coach data', () => {
    render(
      <EditCoachModal
        isOpen={true}
        coach={mockCoach}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByLabelText<HTMLInputElement>(/Name/).value).toBe('John Doe');
    expect(screen.getByLabelText<HTMLInputElement>(/Username/).value).toBe('johndoe');
    expect(screen.getByLabelText<HTMLInputElement>(/Email/).value).toBe('john@example.com');
    expect(screen.getByLabelText<HTMLInputElement>(/Specialization/).value).toBe('Singles Training');
    expect(screen.getByLabelText<HTMLInputElement>(/Profile Photo URL/).value).toBe('https://example.com/photo.jpg');
  });

  it('validates required fields on submit', async () => {
    render(
      <EditCoachModal
        isOpen={true}
        coach={mockCoach}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Clear required fields
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Username/), { target: { value: '' } });

    const submitButton = screen.getByRole('button', { name: /Update Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates username minimum length', async () => {
    render(
      <EditCoachModal
        isOpen={true}
        coach={mockCoach}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText(/Username/), { target: { value: 'ab' } });

    const submitButton = screen.getByRole('button', { name: /Update Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(
      <EditCoachModal
        isOpen={true}
        coach={mockCoach}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /Update Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(
      <EditCoachModal
        isOpen={true}
        coach={mockCoach}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Update a field
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Jane Doe' } });

    const submitButton = screen.getByRole('button', { name: /Update Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('coach-1', {
        name: 'Jane Doe',
        username: 'johndoe',
        email: 'john@example.com',
        specialization: 'Singles Training',
        profilePhoto: 'https://example.com/photo.jpg',
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <EditCoachModal
        isOpen={true}
        coach={mockCoach}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows error message when submit fails', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Network error'));

    render(
      <EditCoachModal
        isOpen={true}
        coach={mockCoach}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Update Coach/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update coach. Please try again.')).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('uses modal-overlay and modal-content classes', () => {
    const { container } = render(
      <EditCoachModal
        isOpen={true}
        coach={mockCoach}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(container.querySelector('.modal-overlay')).toBeInTheDocument();
    expect(container.querySelector('.modal-content')).toBeInTheDocument();
  });

  it('uses modal-body class via modal-form-body', () => {
    const { container } = render(
      <EditCoachModal
        isOpen={true}
        coach={mockCoach}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(container.querySelector('.modal-form-body')).toBeInTheDocument();
  });
});

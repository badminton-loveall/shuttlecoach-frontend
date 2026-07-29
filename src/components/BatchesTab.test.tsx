import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BatchesTab from './BatchesTab';
import apiClient from '../utils/apiClient';

vi.mock('../utils/apiClient');

const mockBatches = [
  {
    id: '1',
    name: 'Morning Batch',
    schedule: 'Mon/Wed/Fri 6:00-7:30 AM',
    assigned_coach_id: 'coach-1',
    coach_name: 'John Doe',
    is_archived: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Evening Batch',
    schedule: 'Tue/Thu 5:00-6:30 PM',
    assigned_coach_id: null,
    coach_name: null,
    is_archived: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('BatchesTab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<BatchesTab readOnly={false} />);

    expect(screen.getByText('Loading batches...')).toBeInTheDocument();
  });

  it('renders batch list after successful fetch', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByText('Morning Batch')).toBeInTheDocument();
      expect(screen.getByText('Evening Batch')).toBeInTheDocument();
    });
  });

  it('displays batch schedule and coach name', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByText('Schedule: Mon/Wed/Fri 6:00-7:30 AM')).toBeInTheDocument();
      expect(screen.getByText('Coach: John Doe')).toBeInTheDocument();
    });
  });

  it('shows error state with retry when fetch fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load batches. Please try again.')).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('retries fetch on retry button click', async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: { batches: mockBatches } });

    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load batches. Please try again.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Morning Batch')).toBeInTheDocument();
    });

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('shows Add Batch button when not readOnly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Add Batch')).toBeInTheDocument();
    });
  });

  it('hides Add Batch button when readOnly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    render(<BatchesTab readOnly={true} />);

    await waitFor(() => {
      expect(screen.getByText('Morning Batch')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('Add Batch')).not.toBeInTheDocument();
  });

  it('hides edit and delete buttons when readOnly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    render(<BatchesTab readOnly={true} />);

    await waitFor(() => {
      expect(screen.getByText('Morning Batch')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('Edit Morning Batch')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete Morning Batch')).not.toBeInTheDocument();
  });

  it('shows edit and delete buttons when not readOnly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Edit Morning Batch')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Morning Batch')).toBeInTheDocument();
    });
  });

  it('shows modal form when Add Batch is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Add Batch')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Add Batch'));

    expect(screen.getByRole('heading', { name: 'Add Batch' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Schedule')).toBeInTheDocument();
  });

  it('shows modal form pre-filled when Edit is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Edit Morning Batch')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Edit Morning Batch'));

    expect(screen.getByText('Edit Batch')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Morning Batch')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mon/Wed/Fri 6:00-7:30 AM')).toBeInTheDocument();
  });

  it('validates name is required on submit', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Add Batch')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Add Batch'));
    fireEvent.click(screen.getByText('Create'));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('calls POST /batches on create', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: '3', name: 'New Batch' } });

    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Add Batch')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Add Batch'));

    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'New Batch' } });
    fireEvent.change(screen.getByLabelText('Schedule'), { target: { value: 'Daily 8 AM' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/batches', {
        name: 'New Batch',
        schedule: 'Daily 8 AM',
      });
    });
  });

  it('calls PATCH /batches/:id on edit', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { id: '1', name: 'Updated Batch' } });

    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Edit Morning Batch')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Edit Morning Batch'));

    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Updated Batch' } });
    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/batches/1', {
        name: 'Updated Batch',
        schedule: 'Mon/Wed/Fri 6:00-7:30 AM',
      });
    });
  });

  it('shows delete confirmation dialog', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Delete Morning Batch')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Delete Morning Batch'));

    expect(screen.getByText('Delete Batch?')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });

  it('calls DELETE /batches/:id on confirm delete', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    vi.mocked(apiClient.delete).mockResolvedValue({ data: { message: 'Batch archived' } });

    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Delete Morning Batch')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Delete Morning Batch'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/batches/1');
    });
  });

  it('shows success message after CRUD operation', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: '3', name: 'New Batch' } });

    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Add Batch')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Add Batch'));
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'New Batch' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Batch created successfully')).toBeInTheDocument();
    });
  });

  it('displays empty state when no batches', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: [] } });
    render(<BatchesTab readOnly={false} />);

    await waitFor(() => {
      expect(screen.getByText('No batches found.')).toBeInTheDocument();
    });
  });
});

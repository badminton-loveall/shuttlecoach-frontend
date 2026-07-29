import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DrillLibrary from './DrillLibrary';
import apiClient from '../utils/apiClient';

vi.mock('../utils/apiClient');

const mockDrills = [
  { id: 'drill-001', name: 'Grip Practice', description: 'Practice correct grip technique for forehand and backhand strokes', category: 'Fundamentals' },
  { id: 'drill-002', name: 'Court Movement Patterns', description: 'Basic footwork patterns covering all six court positions', category: 'Footwork' },
  { id: 'drill-003', name: 'Shadow Practice', description: 'Movement without shuttle focusing on footwork and body positioning', category: 'Footwork' },
  { id: 'drill-010', name: 'High Service Practice', description: 'Consistent high service to backcourt with proper form', category: 'Service' },
  { id: 'drill-011', name: 'Low Service Precision', description: 'Short service landing just over net with minimal height', category: 'Service' },
  { id: 'drill-016', name: 'Sustained Rally Practice', description: 'Maintaining rallies with focus on consistency and placement', category: 'Rally' },
];

describe('DrillLibrary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {})); // never resolves
    render(<DrillLibrary />);

    expect(screen.getByText('Loading drills...')).toBeInTheDocument();
  });

  it('renders drill library title', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { drills: mockDrills } });
    render(<DrillLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Drill Library')).toBeInTheDocument();
    });
  });

  it('renders search input after loading', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { drills: mockDrills } });
    render(<DrillLibrary />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search drills...')).toBeInTheDocument();
    });
  });

  it('renders category filter dropdown', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { drills: mockDrills } });
    render(<DrillLibrary />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('All Categories')).toBeInTheDocument();
    });
  });

  it('displays drill items after fetch', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { drills: mockDrills } });
    render(<DrillLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Grip Practice')).toBeInTheDocument();
      expect(screen.getByText('Court Movement Patterns')).toBeInTheDocument();
    });
  });

  it('displays drill categories as tags', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { drills: mockDrills } });
    render(<DrillLibrary />);

    await waitFor(() => {
      const fundamentalsTags = screen.getAllByText('Fundamentals');
      expect(fundamentalsTags.length).toBeGreaterThan(0);

      const footworkTags = screen.getAllByText('Footwork');
      expect(footworkTags.length).toBeGreaterThan(0);
    });
  });

  it('filters drills by search query', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { drills: mockDrills } });
    render(<DrillLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Grip Practice')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search drills...');
    fireEvent.change(searchInput, { target: { value: 'grip' } });

    expect(screen.getByText('Grip Practice')).toBeInTheDocument();
    expect(screen.queryByText('Sustained Rally Practice')).not.toBeInTheDocument();
  });

  it('filters drills by category', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { drills: mockDrills } });
    render(<DrillLibrary />);

    await waitFor(() => {
      expect(screen.getByText('High Service Practice')).toBeInTheDocument();
    });

    const categorySelect = screen.getByRole('combobox');
    fireEvent.change(categorySelect, { target: { value: 'Service' } });

    expect(screen.getByText('High Service Practice')).toBeInTheDocument();
    expect(screen.getByText('Low Service Precision')).toBeInTheDocument();
    expect(screen.queryByText('Grip Practice')).not.toBeInTheDocument();
  });

  it('displays drag instruction', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { drills: mockDrills } });
    render(<DrillLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Drag drills to weekly planners')).toBeInTheDocument();
    });
  });

  it('shows no drills message when search returns no results', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { drills: mockDrills } });
    render(<DrillLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Grip Practice')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search drills...');
    fireEvent.change(searchInput, { target: { value: 'nonexistentdrill12345' } });

    expect(screen.getByText('No drills found')).toBeInTheDocument();
  });

  it('shows error state when API call fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
    render(<DrillLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load drills. Please try again.')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('retries fetch when Retry button is clicked', async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: { drills: mockDrills } });

    render(<DrillLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load drills. Please try again.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByText('Grip Practice')).toBeInTheDocument();
    });

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('calls apiClient.get with /drills endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { drills: mockDrills } });
    render(<DrillLibrary />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/drills');
    });
  });

  it('derives categories from fetched drill data', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { drills: mockDrills } });
    render(<DrillLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Grip Practice')).toBeInTheDocument();
    });

    const categorySelect = screen.getByRole('combobox');
    const options = categorySelect.querySelectorAll('option');
    const optionValues = Array.from(options).map(o => o.textContent);

    // Should have "All Categories" plus the unique categories from mock data
    expect(optionValues).toContain('All Categories');
    expect(optionValues).toContain('Fundamentals');
    expect(optionValues).toContain('Footwork');
    expect(optionValues).toContain('Service');
    expect(optionValues).toContain('Rally');
  });
});

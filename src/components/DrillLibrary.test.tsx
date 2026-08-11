import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DrillLibrary from './DrillLibrary';

// Mock the useDrills hook
const mockRefetch = vi.fn();
vi.mock('../hooks/useDrills', () => ({
  useDrills: vi.fn(),
}));

import { useDrills } from '../hooks/useDrills';
const mockedUseDrills = vi.mocked(useDrills);

const mockDrills = [
  { id: '1', name: 'BH Short Service', description: 'Backhand short service drill', category: 'Service' },
  { id: '2', name: 'Cross Drop FH', description: 'Forehand cross drop shot', category: 'Forehand (FH)' },
  { id: '3', name: 'Cross Drop Round Head', description: 'Round head cross drop', category: 'Round Head' },
  { id: '4', name: 'BH Clear', description: 'Backhand clear from baseline', category: 'Backhand (BH)' },
];

describe('DrillLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseDrills.mockReturnValue({
      drills: mockDrills,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it('renders drill library title', () => {
    render(<DrillLibrary />);
    expect(screen.getByText('Drill Library')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<DrillLibrary />);
    expect(screen.getByPlaceholderText('Search drills...')).toBeInTheDocument();
  });

  it('renders category filter dropdown with 5 categories plus All', () => {
    render(<DrillLibrary />);
    const categorySelect = screen.getByRole('combobox');
    expect(categorySelect).toBeInTheDocument();

    const options = categorySelect.querySelectorAll('option');
    expect(options).toHaveLength(6); // All + 5 categories

    const optionTexts = Array.from(options).map(o => o.textContent);
    expect(optionTexts).toContain('All Categories');
    expect(optionTexts).toContain('Service');
    expect(optionTexts).toContain('Service Return');
    expect(optionTexts).toContain('Forehand (FH)');
    expect(optionTexts).toContain('Round Head');
    expect(optionTexts).toContain('Backhand (BH)');
  });

  it('displays drill items from API data', () => {
    render(<DrillLibrary />);
    expect(screen.getByText('BH Short Service')).toBeInTheDocument();
    expect(screen.getByText('Cross Drop FH')).toBeInTheDocument();
  });

  it('displays drill categories as badges', () => {
    render(<DrillLibrary />);
    const serviceBadges = screen.getAllByText('Service');
    expect(serviceBadges.length).toBeGreaterThan(0);
  });

  it('filters drills by search query', () => {
    render(<DrillLibrary />);
    const searchInput = screen.getByPlaceholderText('Search drills...');
    fireEvent.change(searchInput, { target: { value: 'BH Short' } });

    expect(screen.getByText('BH Short Service')).toBeInTheDocument();
    expect(screen.queryByText('Cross Drop FH')).not.toBeInTheDocument();
  });

  it('filters drills by category', () => {
    render(<DrillLibrary />);
    const categorySelect = screen.getByRole('combobox');
    fireEvent.change(categorySelect, { target: { value: 'Round Head' } });

    expect(screen.getByText('Cross Drop Round Head')).toBeInTheDocument();
    expect(screen.queryByText('BH Short Service')).not.toBeInTheDocument();
  });

  it('displays drag instruction', () => {
    render(<DrillLibrary />);
    expect(screen.getByText('Drag drills to weekly planners')).toBeInTheDocument();
  });

  it('shows no drills message when search returns no results', () => {
    render(<DrillLibrary />);
    const searchInput = screen.getByPlaceholderText('Search drills...');
    fireEvent.change(searchInput, { target: { value: 'nonexistentdrill12345' } });

    expect(screen.getByText('No drills found')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading and no drills cached', () => {
    mockedUseDrills.mockReturnValue({
      drills: [],
      loading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<DrillLibrary />);
    expect(screen.getByText('Drill Library')).toBeInTheDocument();
    // Should show loading skeleton (animate-pulse div)
    const container = document.querySelector('.animate-pulse');
    expect(container).toBeInTheDocument();
  });

  it('shows error state with retry button on fetch failure', () => {
    mockedUseDrills.mockReturnValue({
      drills: [],
      loading: false,
      error: 'Failed to load drills. Please try again.',
      refetch: mockRefetch,
    });

    render(<DrillLibrary />);
    expect(screen.getByText('Failed to load drills. Please try again.')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked', async () => {
    mockedUseDrills.mockReturnValue({
      drills: [],
      loading: false,
      error: 'Failed to load drills. Please try again.',
      refetch: mockRefetch,
    });

    render(<DrillLibrary />);
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  it('passes refreshTrigger to useDrills hook', () => {
    render(<DrillLibrary refreshTrigger={42} />);
    expect(mockedUseDrills).toHaveBeenCalledWith({ refreshTrigger: 42 });
  });

  it('makes drill items draggable', () => {
    render(<DrillLibrary />);
    const drillItems = document.querySelectorAll('.drill-item');
    drillItems.forEach((item) => {
      expect(item).toHaveAttribute('draggable', 'true');
    });
  });
});

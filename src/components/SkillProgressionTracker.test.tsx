/**
 * Tests for SkillProgressionTracker container component.
 * Validates state machine transitions between heatmap, timeline, and recording views.
 *
 * Requirements: 6.1, 6.7, 7.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillProgressionTracker } from './SkillProgressionTracker';

// Mock the useSkillScores hook
const mockRecordScores = vi.fn().mockResolvedValue(undefined);
const mockRefetch = vi.fn().mockResolvedValue(undefined);

vi.mock('../hooks/useSkillScores', () => ({
  useSkillScores: vi.fn(() => ({
    scores: [],
    loading: false,
    error: null,
    availableCycles: ['Jan-Feb 2025', 'Mar-Apr 2025'],
    recordScores: mockRecordScores,
    refetch: mockRefetch,
  })),
}));

vi.mock('../utils/skillUtils', () => ({
  generateCycleKey: vi.fn(() => 'Jan-Feb 2025'),
}));

// Import after mocks
import { useSkillScores } from '../hooks/useSkillScores';

const mockUseSkillScores = vi.mocked(useSkillScores);

describe('SkillProgressionTracker', () => {
  const studentId = 'student-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSkillScores.mockReturnValue({
      scores: [],
      loading: false,
      error: null,
      availableCycles: ['Jan-Feb 2025', 'Mar-Apr 2025'],
      recordScores: mockRecordScores,
      refetch: mockRefetch,
    });
  });

  it('renders the tracker container', () => {
    render(<SkillProgressionTracker studentId={studentId} />);
    expect(screen.getByTestId('skill-progression-tracker')).toBeInTheDocument();
  });

  it('renders the toolbar with cycle filter and record button', () => {
    render(<SkillProgressionTracker studentId={studentId} />);
    expect(screen.getByTestId('tracker-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('cycle-filter')).toBeInTheDocument();
    expect(screen.getByTestId('record-scores-button')).toBeInTheDocument();
  });

  it('displays available cycles in the select dropdown', () => {
    render(<SkillProgressionTracker studentId={studentId} />);
    const select = screen.getByLabelText('Select training cycle') as HTMLSelectElement;
    expect(select.value).toBe('Jan-Feb 2025');
    expect(screen.getByText('Mar-Apr 2025')).toBeInTheDocument();
  });

  it('defaults to heatmap view', () => {
    render(<SkillProgressionTracker studentId={studentId} />);
    expect(screen.getByTestId('heatmap-view')).toBeInTheDocument();
    expect(screen.queryByTestId('timeline-view')).not.toBeInTheDocument();
    expect(screen.queryByTestId('recording-view')).not.toBeInTheDocument();
  });

  it('shows loading state when scores are loading', () => {
    mockUseSkillScores.mockReturnValue({
      scores: [],
      loading: true,
      error: null,
      availableCycles: [],
      recordScores: mockRecordScores,
      refetch: mockRefetch,
    });

    render(<SkillProgressionTracker studentId={studentId} />);
    expect(screen.getByTestId('tracker-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('tracker-content')).not.toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    mockUseSkillScores.mockReturnValue({
      scores: [],
      loading: false,
      error: 'Failed to load skill scores. Please try again.',
      availableCycles: [],
      recordScores: mockRecordScores,
      refetch: mockRefetch,
    });

    render(<SkillProgressionTracker studentId={studentId} />);
    expect(screen.getByTestId('tracker-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load skill scores. Please try again.')).toBeInTheDocument();

    // Click retry button
    fireEvent.click(screen.getByText('Try again'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('navigates to recording view when Record Scores is clicked', () => {
    render(<SkillProgressionTracker studentId={studentId} />);

    fireEvent.click(screen.getByTestId('record-scores-button'));

    expect(screen.getByTestId('recording-view')).toBeInTheDocument();
    expect(screen.queryByTestId('heatmap-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('skill-score-input')).toHaveAttribute('data-week-number', '1');
  });

  it('navigates back to heatmap when cancel is clicked in recording view', () => {
    render(<SkillProgressionTracker studentId={studentId} />);

    // Go to recording
    fireEvent.click(screen.getByTestId('record-scores-button'));
    expect(screen.getByTestId('recording-view')).toBeInTheDocument();

    // Cancel
    fireEvent.click(screen.getByTestId('cancel-recording-button'));
    expect(screen.getByTestId('heatmap-view')).toBeInTheDocument();
  });

  it('calls recordScores and returns to heatmap on save', async () => {
    render(<SkillProgressionTracker studentId={studentId} />);

    // Go to recording
    fireEvent.click(screen.getByTestId('record-scores-button'));

    // Save
    fireEvent.click(screen.getByTestId('save-scores-button'));

    await waitFor(() => {
      expect(mockRecordScores).toHaveBeenCalledWith({
        studentId,
        cycleKey: 'Jan-Feb 2025',
        weekNumber: 1,
        scores: [],
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('heatmap-view')).toBeInTheDocument();
    });
  });

  it('passes useSkillScores the selected cycle', () => {
    render(<SkillProgressionTracker studentId={studentId} />);

    expect(mockUseSkillScores).toHaveBeenCalledWith({
      studentId,
      cycleKey: 'Jan-Feb 2025',
    });
  });

  it('updates cycle when dropdown selection changes', () => {
    render(<SkillProgressionTracker studentId={studentId} />);

    const select = screen.getByLabelText('Select training cycle');
    fireEvent.change(select, { target: { value: 'Mar-Apr 2025' } });

    // The hook should be called with the new cycle on next render
    expect(mockUseSkillScores).toHaveBeenCalledWith({
      studentId,
      cycleKey: 'Mar-Apr 2025',
    });
  });

  it('shows the default cycle in dropdown when no cycles available', () => {
    mockUseSkillScores.mockReturnValue({
      scores: [],
      loading: false,
      error: null,
      availableCycles: [],
      recordScores: mockRecordScores,
      refetch: mockRefetch,
    });

    render(<SkillProgressionTracker studentId={studentId} />);
    const select = screen.getByLabelText('Select training cycle') as HTMLSelectElement;
    expect(select.value).toBe('Jan-Feb 2025');
  });
});

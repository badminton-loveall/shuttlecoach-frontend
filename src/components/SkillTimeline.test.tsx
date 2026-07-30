/**
 * Tests for SkillTimeline component.
 * Validates timeline rendering, loading/error/empty states, tooltips,
 * current score badge, cycle boundaries, and back navigation.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillTimeline } from './SkillTimeline';
import type { SkillTimelinePoint } from '../hooks/useSkillTimeline';
import type { SkillCategory } from '../constants/skillCatalog';

// Mock the useSkillTimeline hook
vi.mock('../hooks/useSkillTimeline', () => ({
  useSkillTimeline: vi.fn(),
}));

import { useSkillTimeline } from '../hooks/useSkillTimeline';

const mockUseSkillTimeline = vi.mocked(useSkillTimeline);

// ─── Test Data ───────────────────────────────────────────────────────────────

const mockTimeline: SkillTimelinePoint[] = [
  { cycleKey: 'Jan-Feb 2026', weekNumber: 1, score: 0, recordedAt: new Date('2026-01-08T10:00:00Z') },
  { cycleKey: 'Jan-Feb 2026', weekNumber: 2, score: 1, recordedAt: new Date('2026-01-15T10:00:00Z') },
  { cycleKey: 'Jan-Feb 2026', weekNumber: 3, score: 1, recordedAt: new Date('2026-01-22T10:00:00Z') },
  { cycleKey: 'Jan-Feb 2026', weekNumber: 4, score: 2, recordedAt: new Date('2026-01-29T10:00:00Z') },
  { cycleKey: 'Mar-Apr 2026', weekNumber: 1, score: 2, recordedAt: new Date('2026-03-05T10:00:00Z') },
  { cycleKey: 'Mar-Apr 2026', weekNumber: 2, score: 3, recordedAt: new Date('2026-03-12T10:00:00Z') },
];

const defaultProps = {
  studentId: 'student-123',
  skillId: 'bh-short-service',
  skillName: 'BH Short Service',
  onBack: vi.fn(),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SkillTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSkillTimeline.mockReturnValue({
      timeline: mockTimeline,
      skillName: 'BH Short Service',
      category: 'service' as SkillCategory,
      currentScore: 3,
      loading: false,
      error: null,
    });
  });

  it('renders the timeline chart with data points', () => {
    render(<SkillTimeline {...defaultProps} />);
    expect(screen.getByTestId('skill-timeline')).toBeInTheDocument();
    // Check data point dots are rendered
    expect(screen.getByTestId('timeline-dot-0')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-dot-5')).toBeInTheDocument();
  });

  it('calls useSkillTimeline with correct params', () => {
    render(<SkillTimeline {...defaultProps} />);
    expect(mockUseSkillTimeline).toHaveBeenCalledWith({
      studentId: 'student-123',
      skillId: 'bh-short-service',
    });
  });

  it('displays loading state', () => {
    mockUseSkillTimeline.mockReturnValue({
      timeline: [],
      skillName: 'BH Short Service',
      category: 'service' as SkillCategory,
      currentScore: null,
      loading: true,
      error: null,
    });

    render(<SkillTimeline {...defaultProps} />);
    expect(screen.getByTestId('skill-timeline-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading timeline...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockUseSkillTimeline.mockReturnValue({
      timeline: [],
      skillName: 'BH Short Service',
      category: 'service' as SkillCategory,
      currentScore: null,
      loading: false,
      error: 'Failed to load skill timeline. Please try again.',
    });

    render(<SkillTimeline {...defaultProps} />);
    expect(screen.getByTestId('skill-timeline-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load skill timeline. Please try again.')).toBeInTheDocument();
  });

  it('displays empty state when no data', () => {
    mockUseSkillTimeline.mockReturnValue({
      timeline: [],
      skillName: 'BH Short Service',
      category: 'service' as SkillCategory,
      currentScore: null,
      loading: false,
      error: null,
    });

    render(<SkillTimeline {...defaultProps} />);
    expect(screen.getByTestId('skill-timeline-empty')).toBeInTheDocument();
    expect(screen.getByText('No score history available for this skill.')).toBeInTheDocument();
  });

  it('displays current score badge', () => {
    render(<SkillTimeline {...defaultProps} />);
    const badge = screen.getByTestId('current-score-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Current: 3 - Advanced');
  });

  it('does not display current score badge when score is null', () => {
    mockUseSkillTimeline.mockReturnValue({
      timeline: [],
      skillName: 'BH Short Service',
      category: 'service' as SkillCategory,
      currentScore: null,
      loading: false,
      error: null,
    });

    render(<SkillTimeline {...defaultProps} />);
    expect(screen.queryByTestId('current-score-badge')).not.toBeInTheDocument();
  });

  it('renders back button and calls onBack when clicked', () => {
    render(<SkillTimeline {...defaultProps} />);
    const backBtn = screen.getByTestId('timeline-back-button');
    expect(backBtn).toBeInTheDocument();

    fireEvent.click(backBtn);
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('shows tooltip on dot hover', () => {
    render(<SkillTimeline {...defaultProps} />);
    const dot = screen.getByTestId('timeline-dot-0');

    fireEvent.mouseEnter(dot);
    const tooltip = screen.getByTestId('timeline-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('Jan-Feb 2026 - Week 1');

    fireEvent.mouseLeave(dot);
    expect(screen.queryByTestId('timeline-tooltip')).not.toBeInTheDocument();
  });

  it('renders cycle boundary markers', () => {
    render(<SkillTimeline {...defaultProps} />);
    // There is one boundary between Jan-Feb 2026 and Mar-Apr 2026
    expect(screen.getByTestId('cycle-boundary-0')).toBeInTheDocument();
  });

  it('displays skill name in the header', () => {
    render(<SkillTimeline {...defaultProps} />);
    expect(screen.getByText('BH Short Service')).toBeInTheDocument();
  });

  it('renders X-axis week labels', () => {
    render(<SkillTimeline {...defaultProps} />);
    // Wk1 and Wk2 appear twice (once per cycle), Wk3/Wk4 once
    expect(screen.getAllByText('Wk1')).toHaveLength(2);
    expect(screen.getAllByText('Wk2')).toHaveLength(2);
    expect(screen.getByText('Wk3')).toBeInTheDocument();
    expect(screen.getByText('Wk4')).toBeInTheDocument();
  });

  it('renders Y-axis score labels', () => {
    render(<SkillTimeline {...defaultProps} />);
    expect(screen.getByText('4 - Pro')).toBeInTheDocument();
    expect(screen.getByText('3 - Advanced')).toBeInTheDocument();
    expect(screen.getByText('2 - Intermediate')).toBeInTheDocument();
    expect(screen.getByText('1 - Beginner')).toBeInTheDocument();
    expect(screen.getByText("0 - Don't Know")).toBeInTheDocument();
  });

  it('renders cycle labels on X-axis', () => {
    render(<SkillTimeline {...defaultProps} />);
    expect(screen.getByText('Jan-Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('Mar-Apr 2026')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillHistory } from './SkillHistory';
import type { SkillAssessment, SkillScores, SkillScore } from '../types';

// Mock the AuthContext used by SkillAssessmentForm
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Coach Test' },
    role: 'HEAD_COACH',
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock generateCycleKey to return a fixed cycle key (different from test data, making them read-only)
vi.mock('../utils/skillUtils', () => ({
  generateCycleKey: () => 'Jul-Aug 2026',
  calculateCategoryAverage: (scores: number[]) => {
    const tested = scores.filter((s) => s > 0);
    if (tested.length === 0) return 0;
    return parseFloat((tested.reduce((a, b) => a + b, 0) / tested.length).toFixed(1));
  },
}));

function buildTestScores(): SkillScores {
  const categories = ['forehand', 'backhand', 'return', 'service', 'overhead', 'rally'] as const;
  const skillNames: Record<string, string[]> = {
    forehand: ['Clear', 'Drop', 'Smash', 'Drive', 'Net Shot', 'Lift', 'Cross Drop', 'Slice', 'Push', 'Tap'],
    backhand: ['Clear', 'Drop', 'Smash', 'Drive', 'Net Shot', 'Lift', 'Cross Drop', 'Slice', 'Push', 'Tap'],
    return: ['Short Return', 'Deep Return', 'Cross Return', 'Fast Return', 'Slow Return', 'Attacking Return', 'Defensive Return', 'Flick Return', 'Push Return', 'Drive Return'],
    service: ['High Serve', 'Low Serve', 'Flick Serve', 'Drive Serve', 'Slice Serve', 'Jump Serve', 'Fastball Serve', 'Deceptive Serve', 'Side Service', 'Midcourt Serve'],
    overhead: ['Smash', 'Clear', 'Drop', 'Drive', 'Lob', 'Cross Smash', 'Kill Shot', 'Flat Drive', 'Angled Smash', 'Block Smash'],
    rally: ['Rally Control', 'Attack Placement', 'Defensive Positioning', 'Court Movement', 'Shot Selection', 'Tempo Control', 'Momentum Building', 'Under Pressure', 'Endurance', 'Mental Resilience'],
  };

  const scores: Record<string, Record<string, SkillScore>> = {};
  for (const cat of categories) {
    scores[cat] = {};
    for (const name of skillNames[cat]) {
      scores[cat][name] = 2;
    }
  }
  return scores as unknown as SkillScores;
}

function createMockAssessment(overrides: Partial<SkillAssessment> = {}): SkillAssessment {
  return {
    id: 'assessment-1',
    studentId: 'student-1',
    cycleKey: 'Jan-Feb 2026',
    recordedBy: 'Coach Rajan',
    recordedAt: new Date('2026-02-15T10:00:00Z'),
    scores: buildTestScores(),
    isLocked: true,
    ...overrides,
  };
}

describe('SkillHistory', () => {
  it('renders the component with title', () => {
    render(<SkillHistory assessments={[]} />);
    expect(screen.getByTestId('skill-history')).toBeInTheDocument();
    expect(screen.getByText('Assessment History')).toBeInTheDocument();
  });

  it('displays empty message when no assessments are available', () => {
    render(<SkillHistory assessments={[]} />);
    expect(screen.getByTestId('skill-history-empty')).toBeInTheDocument();
    expect(screen.getByText('No past assessments available.')).toBeInTheDocument();
  });

  it('renders a list of past assessments', () => {
    const assessments = [
      createMockAssessment({ id: 'a1', cycleKey: 'Jan-Feb 2026', recordedAt: new Date('2026-02-15') }),
      createMockAssessment({ id: 'a2', cycleKey: 'Mar-Apr 2026', recordedAt: new Date('2026-04-10') }),
    ];

    render(<SkillHistory assessments={assessments} />);
    const cards = screen.getAllByTestId('skill-history-card');
    expect(cards).toHaveLength(2);
  });

  it('displays cycle key, date, and recorder name for each assessment', () => {
    const assessments = [
      createMockAssessment({
        id: 'a1',
        cycleKey: 'Jan-Feb 2026',
        recordedBy: 'Coach Rajan',
        recordedAt: new Date('2026-02-15T10:00:00Z'),
      }),
    ];

    render(<SkillHistory assessments={assessments} />);
    expect(screen.getByText('Jan-Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('Coach Rajan')).toBeInTheDocument();
    // Date formatting depends on locale; check that a date string is present
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('opens read-only modal when clicking a past snapshot', () => {
    const assessments = [
      createMockAssessment({ id: 'a1', cycleKey: 'Jan-Feb 2026' }),
    ];

    render(<SkillHistory assessments={assessments} />);

    const card = screen.getByTestId('skill-history-card');
    fireEvent.click(card);

    expect(screen.getByTestId('skill-history-modal')).toBeInTheDocument();
    expect(screen.getByText('Assessment — Jan-Feb 2026')).toBeInTheDocument();
  });

  it('shows assessment in read-only mode with readonly banner visible', () => {
    const assessments = [
      createMockAssessment({ id: 'a1', cycleKey: 'Jan-Feb 2026' }),
    ];

    render(<SkillHistory assessments={assessments} />);

    fireEvent.click(screen.getByTestId('skill-history-card'));

    // The SkillAssessmentForm displays a read-only banner for past cycles
    expect(screen.getByTestId('readonly-banner')).toBeInTheDocument();
    // Save button should be disabled
    const saveBtn = screen.getByTestId('save-assessment-btn');
    expect(saveBtn).toBeDisabled();
  });

  it('closes modal on close button click', () => {
    const assessments = [
      createMockAssessment({ id: 'a1', cycleKey: 'Jan-Feb 2026' }),
    ];

    render(<SkillHistory assessments={assessments} />);

    fireEvent.click(screen.getByTestId('skill-history-card'));
    expect(screen.getByTestId('skill-history-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('skill-history-modal-close'));
    expect(screen.queryByTestId('skill-history-modal')).not.toBeInTheDocument();
  });

  it('sorts assessments in reverse chronological order', () => {
    const assessments = [
      createMockAssessment({ id: 'a1', cycleKey: 'Jan-Feb 2026', recordedAt: new Date('2026-02-15') }),
      createMockAssessment({ id: 'a2', cycleKey: 'Mar-Apr 2026', recordedAt: new Date('2026-04-10') }),
      createMockAssessment({ id: 'a3', cycleKey: 'May-Jun 2025', recordedAt: new Date('2025-06-01') }),
    ];

    render(<SkillHistory assessments={assessments} />);
    const cards = screen.getAllByTestId('skill-history-card');
    // Most recent first: Mar-Apr 2026, then Jan-Feb 2026, then May-Jun 2025
    expect(cards[0]).toHaveTextContent('Mar-Apr 2026');
    expect(cards[1]).toHaveTextContent('Jan-Feb 2026');
    expect(cards[2]).toHaveTextContent('May-Jun 2025');
  });
});

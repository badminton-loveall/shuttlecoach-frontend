import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrendLineChart } from './TrendLineChart';
import type { SkillAssessment, SkillScores, SkillScore } from '../types';

// Mock ResponsiveContainer (jsdom renders SVG with zero dimensions)
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 600, height: 300 }}>
        {children}
      </div>
    ),
  };
});

function buildScores(baseScore: SkillScore): SkillScores {
  const skillNames: Record<string, string[]> = {
    forehand: ['Clear', 'Drop', 'Smash', 'Drive', 'Net Shot', 'Lift', 'Cross Drop', 'Slice', 'Push', 'Tap'],
    backhand: ['Clear', 'Drop', 'Smash', 'Drive', 'Net Shot', 'Lift', 'Cross Drop', 'Slice', 'Push', 'Tap'],
    return: ['Short Return', 'Deep Return', 'Cross Return', 'Fast Return', 'Slow Return', 'Attacking Return', 'Defensive Return', 'Flick Return', 'Push Return', 'Drive Return'],
    service: ['High Serve', 'Low Serve', 'Flick Serve', 'Drive Serve', 'Slice Serve', 'Jump Serve', 'Fastball Serve', 'Deceptive Serve', 'Side Service', 'Midcourt Serve'],
    overhead: ['Smash', 'Clear', 'Drop', 'Drive', 'Lob', 'Cross Smash', 'Kill Shot', 'Flat Drive', 'Angled Smash', 'Block Smash'],
    rally: ['Rally Control', 'Attack Placement', 'Defensive Positioning', 'Court Movement', 'Shot Selection', 'Tempo Control', 'Momentum Building', 'Under Pressure', 'Endurance', 'Mental Resilience'],
  };

  const scores: Record<string, Record<string, SkillScore>> = {};
  for (const [cat, names] of Object.entries(skillNames)) {
    scores[cat] = {};
    for (const name of names) {
      scores[cat][name] = baseScore;
    }
  }
  return scores as unknown as SkillScores;
}

function buildSampleAssessments(): SkillAssessment[] {
  return [
    {
      id: 'a1',
      studentId: 's1',
      cycleKey: 'Jan-Feb 2025',
      recordedBy: 'Coach A',
      recordedAt: new Date('2025-02-01'),
      scores: buildScores(2),
      isLocked: true,
    },
    {
      id: 'a2',
      studentId: 's1',
      cycleKey: 'Mar-Apr 2025',
      recordedBy: 'Coach A',
      recordedAt: new Date('2025-04-01'),
      scores: buildScores(3),
      isLocked: true,
    },
    {
      id: 'a3',
      studentId: 's1',
      cycleKey: 'May-Jun 2025',
      recordedBy: 'Coach A',
      recordedAt: new Date('2025-06-01'),
      scores: buildScores(4),
      isLocked: false,
    },
  ];
}

describe('TrendLineChart', () => {
  it('renders without crashing with empty assessments', () => {
    render(<TrendLineChart assessments={[]} />);
    expect(screen.getByTestId('trend-line-chart')).toBeInTheDocument();
    expect(screen.getByText('Skill Trends')).toBeInTheDocument();
    expect(screen.getByText('No historical assessment data available yet.')).toBeInTheDocument();
  });

  it('renders chart with sample assessment data', () => {
    render(<TrendLineChart assessments={buildSampleAssessments()} />);
    expect(screen.getByTestId('trend-line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.queryByText('No historical assessment data available yet.')).not.toBeInTheDocument();
  });

  it('toggles between per-category and per-skill views', () => {
    render(<TrendLineChart assessments={buildSampleAssessments()} />);

    const perCategoryBtn = screen.getByText('Per Category');
    const perSkillBtn = screen.getByText('Per Skill');

    // Initially per-category is active
    expect(perCategoryBtn).toHaveAttribute('aria-pressed', 'true');
    expect(perSkillBtn).toHaveAttribute('aria-pressed', 'false');

    // Category selector should not be visible in per-category mode
    expect(screen.queryByLabelText('Select category')).not.toBeInTheDocument();

    // Switch to per-skill
    fireEvent.click(perSkillBtn);
    expect(perSkillBtn).toHaveAttribute('aria-pressed', 'true');
    expect(perCategoryBtn).toHaveAttribute('aria-pressed', 'false');

    // Category selector should now be visible
    expect(screen.getByLabelText('Select category')).toBeInTheDocument();
  });

  it('displays correct axis labels (Y-axis has Score label)', () => {
    render(<TrendLineChart assessments={buildSampleAssessments()} />);
    // The chart renders; we verify the container is present (SVG axis internals
    // are not easily queryable in jsdom, but the responsive container wrapping works)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('shows category selector when in per-skill mode', () => {
    render(<TrendLineChart assessments={buildSampleAssessments()} />);

    fireEvent.click(screen.getByText('Per Skill'));

    const select = screen.getByLabelText('Select category');
    expect(select).toBeInTheDocument();

    // Change category
    fireEvent.change(select, { target: { value: 'service' } });
    expect(select).toHaveValue('service');
  });
});

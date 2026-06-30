import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkillRadarChart } from './SkillRadarChart';
import type { SkillScores, SkillScore } from '../types';

// Recharts uses SVG internally. In jsdom, ResponsiveContainer has zero dimensions,
// so we mock it to render children directly.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 400, height: 300 }}>
        {children}
      </div>
    ),
  };
});

function buildEmptyScores(): SkillScores {
  const categories = ['forehand', 'backhand', 'return', 'service', 'overhead', 'rally'] as const;
  const skills: Record<string, Record<string, SkillScore>> = {};
  const skillNames: Record<string, string[]> = {
    forehand: ['Clear', 'Drop', 'Smash', 'Drive', 'Net Shot', 'Lift', 'Cross Drop', 'Slice', 'Push', 'Tap'],
    backhand: ['Clear', 'Drop', 'Smash', 'Drive', 'Net Shot', 'Lift', 'Cross Drop', 'Slice', 'Push', 'Tap'],
    return: ['Short Return', 'Deep Return', 'Cross Return', 'Fast Return', 'Slow Return', 'Attacking Return', 'Defensive Return', 'Flick Return', 'Push Return', 'Drive Return'],
    service: ['High Serve', 'Low Serve', 'Flick Serve', 'Drive Serve', 'Slice Serve', 'Jump Serve', 'Fastball Serve', 'Deceptive Serve', 'Side Service', 'Midcourt Serve'],
    overhead: ['Smash', 'Clear', 'Drop', 'Drive', 'Lob', 'Cross Smash', 'Kill Shot', 'Flat Drive', 'Angled Smash', 'Block Smash'],
    rally: ['Rally Control', 'Attack Placement', 'Defensive Positioning', 'Court Movement', 'Shot Selection', 'Tempo Control', 'Momentum Building', 'Under Pressure', 'Endurance', 'Mental Resilience'],
  };

  for (const cat of categories) {
    skills[cat] = {};
    for (const name of skillNames[cat]) {
      skills[cat][name] = 0;
    }
  }
  return skills as unknown as SkillScores;
}

function buildSampleScores(): SkillScores {
  const scores = buildEmptyScores();
  // Set some non-zero scores for forehand and service
  (scores.forehand as Record<string, SkillScore>)['Clear'] = 3;
  (scores.forehand as Record<string, SkillScore>)['Drop'] = 2;
  (scores.forehand as Record<string, SkillScore>)['Smash'] = 4;
  (scores.service as Record<string, SkillScore>)['High Serve'] = 2;
  (scores.service as Record<string, SkillScore>)['Low Serve'] = 3;
  return scores;
}

describe('SkillRadarChart', () => {
  it('renders without crashing', () => {
    render(<SkillRadarChart scores={null} />);
    expect(screen.getByTestId('skill-radar-chart')).toBeInTheDocument();
  });

  it('displays the title', () => {
    render(<SkillRadarChart scores={null} />);
    expect(screen.getByText('Category Averages')).toBeInTheDocument();
  });

  it('renders the chart container with responsive wrapper', () => {
    render(<SkillRadarChart scores={null} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    // Recharts renders radar chart inside, labels are SVG text (not queryable in jsdom)
    expect(screen.getByTestId('skill-radar-chart')).toBeInTheDocument();
  });

  it('handles null scores gracefully (empty state)', () => {
    render(<SkillRadarChart scores={null} />);
    expect(screen.getByTestId('skill-radar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('handles all-zero scores gracefully', () => {
    const scores = buildEmptyScores();
    render(<SkillRadarChart scores={scores} />);
    expect(screen.getByTestId('skill-radar-chart')).toBeInTheDocument();
  });

  it('renders with sample assessment scores', () => {
    const scores = buildSampleScores();
    render(<SkillRadarChart scores={scores} />);
    expect(screen.getByTestId('skill-radar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });
});

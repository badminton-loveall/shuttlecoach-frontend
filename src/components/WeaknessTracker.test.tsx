import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeaknessTracker } from './WeaknessTracker';
import type { SkillAssessment, SkillScores, SkillScore } from '../types';

/**
 * Helper: build SkillScores with a uniform base score for all 60 skills.
 */
function buildUniformScores(baseScore: SkillScore): SkillScores {
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

/**
 * Helper: build SkillScores with specific overrides on top of a base score.
 */
function buildScoresWithOverrides(
  baseScore: SkillScore,
  overrides: { category: string; skillName: string; score: SkillScore }[]
): SkillScores {
  const scores = buildUniformScores(baseScore);
  for (const override of overrides) {
    (scores as unknown as Record<string, Record<string, SkillScore>>)[override.category][override.skillName] = override.score;
  }
  return scores;
}

function buildAssessment(scores: SkillScores, id = 'a1', cycleKey = 'Jan-Feb 2025'): SkillAssessment {
  return {
    id,
    studentId: 's1',
    cycleKey,
    recordedBy: 'Coach A',
    recordedAt: new Date('2025-02-01'),
    scores,
    isLocked: true,
  };
}

describe('WeaknessTracker', () => {
  it('renders empty state when currentAssessment is null', () => {
    render(<WeaknessTracker currentAssessment={null} />);
    expect(screen.getByTestId('weakness-tracker')).toBeInTheDocument();
    expect(screen.getByText('No assessment data available.')).toBeInTheDocument();
  });

  it('renders no-weaknesses message when all scores are above 1', () => {
    const assessment = buildAssessment(buildUniformScores(3));
    render(<WeaknessTracker currentAssessment={assessment} />);
    expect(screen.getByText('No weaknesses detected — great progress!')).toBeInTheDocument();
    expect(screen.queryAllByTestId('weakness-card')).toHaveLength(0);
  });

  it('lists skills with score 0 or 1 as weak skills', () => {
    const scores = buildScoresWithOverrides(3, [
      { category: 'forehand', skillName: 'Clear', score: 1 },
      { category: 'forehand', skillName: 'Drop', score: 0 },
      { category: 'service', skillName: 'High Serve', score: 1 },
    ]);
    const assessment = buildAssessment(scores);

    render(<WeaknessTracker currentAssessment={assessment} />);

    const cards = screen.getAllByTestId('weakness-card');
    expect(cards).toHaveLength(3);
  });

  it('displays skill name and category for each weak skill', () => {
    const scores = buildScoresWithOverrides(3, [
      { category: 'forehand', skillName: 'Smash', score: 1 },
      { category: 'rally', skillName: 'Endurance', score: 0 },
    ]);
    const assessment = buildAssessment(scores);

    render(<WeaknessTracker currentAssessment={assessment} />);

    expect(screen.getByText('Smash')).toBeInTheDocument();
    expect(screen.getByText('Forehand')).toBeInTheDocument();
    expect(screen.getByText('Endurance')).toBeInTheDocument();
    expect(screen.getByText('Rally')).toBeInTheDocument();
  });

  it('shows improving trend arrow when score increased from previous cycle', () => {
    // Previous had score 0, current has score 1 → improving
    const prevScores = buildScoresWithOverrides(3, [
      { category: 'forehand', skillName: 'Clear', score: 0 },
    ]);
    const currScores = buildScoresWithOverrides(3, [
      { category: 'forehand', skillName: 'Clear', score: 1 },
    ]);

    const prevAssessment = buildAssessment(prevScores, 'a1', 'Nov-Dec 2024');
    const currAssessment = buildAssessment(currScores, 'a2', 'Jan-Feb 2025');

    render(
      <WeaknessTracker
        currentAssessment={currAssessment}
        previousAssessment={prevAssessment}
      />
    );

    const trend = screen.getByTestId('weakness-trend');
    expect(trend).toHaveTextContent('↑');
    expect(trend).toHaveAttribute('aria-label', 'Improving');
  });

  it('shows declining trend arrow when score decreased from previous cycle', () => {
    // Previous had score 1, current has score 0 → declining
    const prevScores = buildScoresWithOverrides(3, [
      { category: 'backhand', skillName: 'Drop', score: 1 },
    ]);
    const currScores = buildScoresWithOverrides(3, [
      { category: 'backhand', skillName: 'Drop', score: 0 },
    ]);

    const prevAssessment = buildAssessment(prevScores, 'a1', 'Nov-Dec 2024');
    const currAssessment = buildAssessment(currScores, 'a2', 'Jan-Feb 2025');

    render(
      <WeaknessTracker
        currentAssessment={currAssessment}
        previousAssessment={prevAssessment}
      />
    );

    const trend = screen.getByTestId('weakness-trend');
    expect(trend).toHaveTextContent('↓');
    expect(trend).toHaveAttribute('aria-label', 'Declining');
  });

  it('shows stable indicator when score is unchanged from previous cycle', () => {
    // Both previous and current have score 1 → stable
    const prevScores = buildScoresWithOverrides(3, [
      { category: 'service', skillName: 'Low Serve', score: 1 },
    ]);
    const currScores = buildScoresWithOverrides(3, [
      { category: 'service', skillName: 'Low Serve', score: 1 },
    ]);

    const prevAssessment = buildAssessment(prevScores, 'a1', 'Nov-Dec 2024');
    const currAssessment = buildAssessment(currScores, 'a2', 'Jan-Feb 2025');

    render(
      <WeaknessTracker
        currentAssessment={currAssessment}
        previousAssessment={prevAssessment}
      />
    );

    const trend = screen.getByTestId('weakness-trend');
    expect(trend).toHaveTextContent('–');
    expect(trend).toHaveAttribute('aria-label', 'Stable');
  });

  it('does not show trend arrow when no previous assessment (new trend)', () => {
    const scores = buildScoresWithOverrides(3, [
      { category: 'overhead', skillName: 'Lob', score: 0 },
    ]);
    const assessment = buildAssessment(scores);

    render(<WeaknessTracker currentAssessment={assessment} />);

    // No trend indicator should be rendered for "new" trend
    expect(screen.queryByTestId('weakness-trend')).not.toBeInTheDocument();
  });
});

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

describe('WeaknessTracker (Skill Assessment by Category)', () => {
  it('renders empty state when currentAssessment is null', () => {
    render(<WeaknessTracker currentAssessment={null} />);
    expect(screen.getByTestId('weakness-tracker')).toBeInTheDocument();
    expect(screen.getByText('No assessment data available.')).toBeInTheDocument();
  });

  it('renders the section title as "Skill Assessment by Category"', () => {
    const assessment = buildAssessment(buildUniformScores(3));
    render(<WeaknessTracker currentAssessment={assessment} />);
    expect(screen.getByText('Skill Assessment by Category')).toBeInTheDocument();
  });

  it('renders all 6 category cards', () => {
    const assessment = buildAssessment(buildUniformScores(2));
    render(<WeaknessTracker currentAssessment={assessment} />);

    expect(screen.getByTestId('category-card-forehand')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-backhand')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-return')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-service')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-overhead')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-rally')).toBeInTheDocument();
  });

  it('shows ALL 60 skills (10 per category), not just weak ones', () => {
    const assessment = buildAssessment(buildUniformScores(3));
    render(<WeaknessTracker currentAssessment={assessment} />);

    const skillRows = screen.getAllByTestId('skill-row');
    expect(skillRows).toHaveLength(60);
  });

  it('displays category average in the header', () => {
    const scores = buildScoresWithOverrides(2, [
      { category: 'forehand', skillName: 'Clear', score: 4 },
      { category: 'forehand', skillName: 'Drop', score: 4 },
    ]);
    const assessment = buildAssessment(scores);
    render(<WeaknessTracker currentAssessment={assessment} />);

    // Forehand: 8 skills at 2 + 2 skills at 4 = 24/10 = 2.4
    expect(screen.getByText('Avg: 2.4/4')).toBeInTheDocument();
  });

  it('displays skill name and score label for each skill', () => {
    const scores = buildScoresWithOverrides(3, [
      { category: 'forehand', skillName: 'Smash', score: 1 },
    ]);
    const assessment = buildAssessment(scores);
    render(<WeaknessTracker currentAssessment={assessment} />);

    // Smash should appear with "1 - Beginner"
    expect(screen.getByText('1 - Beginner')).toBeInTheDocument();
  });

  it('shows improving trend arrow when score increased from previous cycle', () => {
    const prevScores = buildScoresWithOverrides(3, [
      { category: 'forehand', skillName: 'Clear', score: 1 },
    ]);
    const currScores = buildScoresWithOverrides(3, [
      { category: 'forehand', skillName: 'Clear', score: 2 },
    ]);

    const prevAssessment = buildAssessment(prevScores, 'a1', 'Nov-Dec 2024');
    const currAssessment = buildAssessment(currScores, 'a2', 'Jan-Feb 2025');

    render(
      <WeaknessTracker
        currentAssessment={currAssessment}
        previousAssessment={prevAssessment}
      />
    );

    // Find the improving trend indicator for Clear (score went 1 → 2)
    const trendElements = screen.getAllByLabelText('improving');
    expect(trendElements.length).toBeGreaterThanOrEqual(1);
    expect(trendElements[0]).toHaveTextContent('↑');
  });

  it('shows declining trend arrow when score decreased from previous cycle', () => {
    const prevScores = buildScoresWithOverrides(3, [
      { category: 'backhand', skillName: 'Drop', score: 3 },
    ]);
    const currScores = buildScoresWithOverrides(3, [
      { category: 'backhand', skillName: 'Drop', score: 2 },
    ]);

    const prevAssessment = buildAssessment(prevScores, 'a1', 'Nov-Dec 2024');
    const currAssessment = buildAssessment(currScores, 'a2', 'Jan-Feb 2025');

    render(
      <WeaknessTracker
        currentAssessment={currAssessment}
        previousAssessment={prevAssessment}
      />
    );

    const trendElements = screen.getAllByLabelText('declining');
    expect(trendElements.length).toBeGreaterThanOrEqual(1);
    expect(trendElements[0]).toHaveTextContent('↓');
  });

  it('shows stable indicator when score is unchanged from previous cycle', () => {
    const prevScores = buildUniformScores(3);
    const currScores = buildUniformScores(3);

    const prevAssessment = buildAssessment(prevScores, 'a1', 'Nov-Dec 2024');
    const currAssessment = buildAssessment(currScores, 'a2', 'Jan-Feb 2025');

    render(
      <WeaknessTracker
        currentAssessment={currAssessment}
        previousAssessment={prevAssessment}
      />
    );

    // All skills stable → all trend indicators should show "–"
    const trendElements = screen.getAllByLabelText('stable');
    expect(trendElements).toHaveLength(60);
    expect(trendElements[0]).toHaveTextContent('–');
  });

  it('does not show trend indicators when no previous assessment', () => {
    const scores = buildUniformScores(2);
    const assessment = buildAssessment(scores);

    render(<WeaknessTracker currentAssessment={assessment} />);

    // No trend indicators should be rendered
    expect(screen.queryByLabelText('improving')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('declining')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('stable')).not.toBeInTheDocument();
  });

  it('renders score dots for each skill', () => {
    const assessment = buildAssessment(buildUniformScores(2));
    render(<WeaknessTracker currentAssessment={assessment} />);

    // Each skill row should have 5 score dots (0-4 range)
    const dots = document.querySelectorAll('.score-dot');
    // 60 skills × 5 dots = 300
    expect(dots).toHaveLength(300);
  });
});

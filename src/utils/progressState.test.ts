import { describe, it, expect } from 'vitest';
import { deriveProgressState } from './progressState';
import type { SkillAssessment, SkillScores } from '../types';

function makeScores(baseScore: 0 | 1 | 2 | 3 | 4 = 2): SkillScores {
  const categoryScores = {
    Clear: baseScore,
    Drop: baseScore,
    Smash: baseScore,
    Drive: baseScore,
    'Net Shot': baseScore,
    Lift: baseScore,
    'Cross Drop': baseScore,
    Slice: baseScore,
    Push: baseScore,
    Tap: baseScore,
  };
  return {
    forehand: { ...categoryScores },
    backhand: { ...categoryScores },
    return: {
      'Short Return': baseScore,
      'Deep Return': baseScore,
      'Cross Return': baseScore,
      'Fast Return': baseScore,
      'Slow Return': baseScore,
      'Attacking Return': baseScore,
      'Defensive Return': baseScore,
      'Flick Return': baseScore,
      'Push Return': baseScore,
      'Drive Return': baseScore,
    },
    service: {
      'High Serve': baseScore,
      'Low Serve': baseScore,
      'Flick Serve': baseScore,
      'Drive Serve': baseScore,
      'Slice Serve': baseScore,
      'Jump Serve': baseScore,
      'Fastball Serve': baseScore,
      'Deceptive Serve': baseScore,
      'Side Service': baseScore,
      'Midcourt Serve': baseScore,
    },
    overhead: { ...categoryScores },
    rally: {
      'Rally Control': baseScore,
      'Attack Placement': baseScore,
      'Defensive Positioning': baseScore,
      'Court Movement': baseScore,
      'Shot Selection': baseScore,
      'Tempo Control': baseScore,
      'Momentum Building': baseScore,
      'Under Pressure': baseScore,
      Endurance: baseScore,
      'Mental Resilience': baseScore,
    },
  };
}

function makeAssessment(overrides: Partial<SkillAssessment> = {}): SkillAssessment {
  return {
    id: 'assessment-1',
    studentId: 'student-1',
    cycleKey: 'Jan-Feb 2026',
    recordedBy: 'Coach A',
    recordedAt: new Date('2026-01-15'),
    scores: makeScores(2),
    isLocked: false,
    ...overrides,
  };
}

describe('deriveProgressState', () => {
  it('returns all null values for empty input array', () => {
    const result = deriveProgressState([]);
    expect(result.currentScores).toBeNull();
    expect(result.currentAssessment).toBeNull();
    expect(result.previousAssessment).toBeNull();
  });

  it('returns current assessment and null previous for single assessment', () => {
    const assessment = makeAssessment();
    const result = deriveProgressState([assessment]);

    expect(result.currentAssessment).toEqual(assessment);
    expect(result.currentScores).toEqual(assessment.scores);
    expect(result.previousAssessment).toBeNull();
  });

  it('returns most recent as current and second most recent as previous', () => {
    const older = makeAssessment({
      id: 'assessment-old',
      recordedAt: new Date('2026-01-10'),
      scores: makeScores(1),
    });
    const newer = makeAssessment({
      id: 'assessment-new',
      recordedAt: new Date('2026-02-15'),
      scores: makeScores(3),
    });

    const result = deriveProgressState([older, newer]);

    expect(result.currentAssessment).toEqual(newer);
    expect(result.currentScores).toEqual(newer.scores);
    expect(result.previousAssessment).toEqual(older);
  });

  it('correctly identifies current and previous regardless of input order', () => {
    const first = makeAssessment({
      id: 'a1',
      recordedAt: new Date('2026-01-05'),
    });
    const second = makeAssessment({
      id: 'a2',
      recordedAt: new Date('2026-02-10'),
    });
    const third = makeAssessment({
      id: 'a3',
      recordedAt: new Date('2026-03-20'),
    });

    // Pass in non-chronological order
    const result = deriveProgressState([second, third, first]);

    expect(result.currentAssessment!.id).toBe('a3');
    expect(result.previousAssessment!.id).toBe('a2');
  });

  it('handles three or more assessments - only returns current and previous', () => {
    const assessments = [
      makeAssessment({ id: 'a1', recordedAt: new Date('2026-01-01') }),
      makeAssessment({ id: 'a2', recordedAt: new Date('2026-02-01') }),
      makeAssessment({ id: 'a3', recordedAt: new Date('2026-03-01') }),
      makeAssessment({ id: 'a4', recordedAt: new Date('2026-04-01') }),
    ];

    const result = deriveProgressState(assessments);

    expect(result.currentAssessment!.id).toBe('a4');
    expect(result.previousAssessment!.id).toBe('a3');
  });

  it('currentScores matches currentAssessment.scores', () => {
    const scores = makeScores(4);
    const assessment = makeAssessment({ scores });

    const result = deriveProgressState([assessment]);

    expect(result.currentScores).toBe(result.currentAssessment!.scores);
  });
});

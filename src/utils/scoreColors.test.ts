import { describe, it, expect } from 'vitest';
import { getScoreColor, getScoreLabel, SCORE_LABELS } from './scoreColors';
import type { SkillScore } from '../constants/skillCatalog';

describe('getScoreColor', () => {
  it('maps score 0 to #FEE2E2', () => {
    expect(getScoreColor(0)).toBe('#FEE2E2');
  });

  it('maps score 1 to #FED7AA', () => {
    expect(getScoreColor(1)).toBe('#FED7AA');
  });

  it('maps score 2 to #FEF08A', () => {
    expect(getScoreColor(2)).toBe('#FEF08A');
  });

  it('maps score 3 to #BBF7D0', () => {
    expect(getScoreColor(3)).toBe('#BBF7D0');
  });

  it('maps score 4 to #16A34A', () => {
    expect(getScoreColor(4)).toBe('#16A34A');
  });

  it('returns a consistent color for the same score', () => {
    const scores: SkillScore[] = [0, 1, 2, 3, 4];
    for (const score of scores) {
      expect(getScoreColor(score)).toBe(getScoreColor(score));
    }
  });
});

describe('getScoreLabel', () => {
  it('maps score 0 to "Don\'t Know"', () => {
    expect(getScoreLabel(0)).toBe("Don't Know");
  });

  it('maps score 1 to "Beginner"', () => {
    expect(getScoreLabel(1)).toBe('Beginner');
  });

  it('maps score 2 to "Intermediate"', () => {
    expect(getScoreLabel(2)).toBe('Intermediate');
  });

  it('maps score 3 to "Advanced"', () => {
    expect(getScoreLabel(3)).toBe('Advanced');
  });

  it('maps score 4 to "Pro"', () => {
    expect(getScoreLabel(4)).toBe('Pro');
  });
});

describe('SCORE_LABELS', () => {
  it('contains entries for all 5 score levels', () => {
    const scores: SkillScore[] = [0, 1, 2, 3, 4];
    for (const score of scores) {
      expect(SCORE_LABELS[score]).toBeDefined();
      expect(typeof SCORE_LABELS[score]).toBe('string');
    }
  });
});

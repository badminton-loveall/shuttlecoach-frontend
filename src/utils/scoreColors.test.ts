import { describe, it, expect } from 'vitest';
import { getScoreColor, getScoreLabel, SCORE_LABELS } from './scoreColors';
import type { SkillScore } from '../constants/skillCatalog';

describe('getScoreColor', () => {
  it('maps score 0 to #F6E4E1', () => {
    expect(getScoreColor(0)).toBe('#F6E4E1');
  });

  it('maps score 1 to #F3DCC4', () => {
    expect(getScoreColor(1)).toBe('#F3DCC4');
  });

  it('maps score 2 to #EDD9B0', () => {
    expect(getScoreColor(2)).toBe('#EDD9B0');
  });

  it('maps score 3 to #B9D3C2', () => {
    expect(getScoreColor(3)).toBe('#B9D3C2');
  });

  it('maps score 4 to #2F6B4F', () => {
    expect(getScoreColor(4)).toBe('#2F6B4F');
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

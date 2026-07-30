/**
 * Tests for buildSkillScoreMatrix utility function
 *
 * Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { describe, it, expect } from 'vitest';
import { buildSkillScoreMatrix } from './skillScoreMatrix';
import { SKILL_CATALOG, ALL_SKILL_IDS, WeeklySkillScore, SkillScore, SkillCategory } from '../constants/skillCatalog';

function makeScore(overrides: Partial<WeeklySkillScore> = {}): WeeklySkillScore {
  return {
    id: 'score-1',
    studentId: 'student-1',
    weekNumber: 1,
    cycleKey: 'Jan-Feb 2026',
    skillId: 'bh-short-service',
    skillName: 'BH Short Service',
    category: 'service',
    score: 2,
    recordedBy: 'coach-1',
    recordedAt: new Date('2026-01-08T10:00:00Z'),
    ...overrides,
  };
}

describe('buildSkillScoreMatrix', () => {
  const cycleKey = 'Jan-Feb 2026';

  describe('structure completeness (Req 14.2, 14.3)', () => {
    it('should produce all skills from SKILL_CATALOG with empty input', () => {
      const result = buildSkillScoreMatrix([], cycleKey);
      const totalSkills = result.categories.reduce(
        (sum, cat) => sum + cat.skills.length,
        0
      );
      expect(totalSkills).toBe(ALL_SKILL_IDS.length);
    });

    it('should produce exactly 5 category groups', () => {
      const result = buildSkillScoreMatrix([], cycleKey);
      expect(result.categories).toHaveLength(5);
    });

    it('should produce exactly 8 score slots per skill', () => {
      const result = buildSkillScoreMatrix([], cycleKey);
      for (const category of result.categories) {
        for (const skill of category.skills) {
          expect(skill.scores).toHaveLength(8);
        }
      }
    });

    it('should have weeks array with Week 1 through Week 8', () => {
      const result = buildSkillScoreMatrix([], cycleKey);
      expect(result.weeks).toEqual([
        'Week 1', 'Week 2', 'Week 3', 'Week 4',
        'Week 5', 'Week 6', 'Week 7', 'Week 8',
      ]);
    });

    it('should set all scores to null when no data exists', () => {
      const result = buildSkillScoreMatrix([], cycleKey);
      for (const category of result.categories) {
        for (const skill of category.skills) {
          expect(skill.scores.every((s) => s === null)).toBe(true);
          expect(skill.latestScore).toBeNull();
        }
      }
    });
  });

  describe('score placement (Req 14.1, 14.4)', () => {
    it('should place a score in the correct (skill, week) cell', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ skillId: 'bh-short-service', weekNumber: 3, score: 2 }),
      ];
      const result = buildSkillScoreMatrix(scores, cycleKey);
      const serviceCategory = result.categories.find((c) => c.categoryId === 'service')!;
      const skill = serviceCategory.skills.find((s) => s.skillId === 'bh-short-service')!;
      expect(skill.scores[2]).toBe(2); // Week 3 is index 2
      expect(skill.scores[0]).toBeNull(); // Week 1
      expect(skill.scores[1]).toBeNull(); // Week 2
    });

    it('should handle multiple scores for different weeks of the same skill', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ skillId: 'bh-short-service', weekNumber: 1, score: 1 }),
        makeScore({ id: 'score-2', skillId: 'bh-short-service', weekNumber: 4, score: 3 }),
        makeScore({ id: 'score-3', skillId: 'bh-short-service', weekNumber: 7, score: 4 }),
      ];
      const result = buildSkillScoreMatrix(scores, cycleKey);
      const serviceCategory = result.categories.find((c) => c.categoryId === 'service')!;
      const skill = serviceCategory.skills.find((s) => s.skillId === 'bh-short-service')!;
      expect(skill.scores[0]).toBe(1); // Week 1
      expect(skill.scores[3]).toBe(3); // Week 4
      expect(skill.scores[6]).toBe(4); // Week 7
      expect(skill.scores[1]).toBeNull();
      expect(skill.scores[2]).toBeNull();
    });

    it('should place scores for different skills in their correct categories', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ skillId: 'bh-short-service', weekNumber: 1, score: 2, category: 'service' }),
        makeScore({ id: 'score-2', skillId: 'cross-drop-fh', weekNumber: 2, score: 3, category: 'forehand' }),
        makeScore({ id: 'score-3', skillId: 'straight-defence-bh', weekNumber: 3, score: 1, category: 'backhand' }),
      ];
      const result = buildSkillScoreMatrix(scores, cycleKey);

      const service = result.categories.find((c) => c.categoryId === 'service')!;
      const forehand = result.categories.find((c) => c.categoryId === 'forehand')!;
      const backhand = result.categories.find((c) => c.categoryId === 'backhand')!;

      expect(service.skills.find((s) => s.skillId === 'bh-short-service')!.scores[0]).toBe(2);
      expect(forehand.skills.find((s) => s.skillId === 'cross-drop-fh')!.scores[1]).toBe(3);
      expect(backhand.skills.find((s) => s.skillId === 'straight-defence-bh')!.scores[2]).toBe(1);
    });
  });

  describe('cycle filtering (Req 14.4)', () => {
    it('should only include scores matching the cycleKey parameter', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ skillId: 'bh-short-service', weekNumber: 1, score: 2, cycleKey: 'Jan-Feb 2026' }),
        makeScore({ id: 'score-2', skillId: 'bh-short-service', weekNumber: 2, score: 3, cycleKey: 'Mar-Apr 2026' }),
      ];
      const result = buildSkillScoreMatrix(scores, 'Jan-Feb 2026');
      const serviceCategory = result.categories.find((c) => c.categoryId === 'service')!;
      const skill = serviceCategory.skills.find((s) => s.skillId === 'bh-short-service')!;
      expect(skill.scores[0]).toBe(2);
      expect(skill.scores[1]).toBeNull(); // Mar-Apr score filtered out
    });

    it('should return all nulls when no scores match the cycle', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ skillId: 'bh-short-service', weekNumber: 1, score: 3, cycleKey: 'Mar-Apr 2026' }),
      ];
      const result = buildSkillScoreMatrix(scores, 'Jan-Feb 2026');
      const serviceCategory = result.categories.find((c) => c.categoryId === 'service')!;
      const skill = serviceCategory.skills.find((s) => s.skillId === 'bh-short-service')!;
      expect(skill.scores.every((s) => s === null)).toBe(true);
    });
  });

  describe('latestScore computation (Req 14.5)', () => {
    it('should compute latestScore as the last non-null value in week sequence', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ skillId: 'bh-short-service', weekNumber: 1, score: 1 }),
        makeScore({ id: 'score-2', skillId: 'bh-short-service', weekNumber: 3, score: 2 }),
        makeScore({ id: 'score-3', skillId: 'bh-short-service', weekNumber: 5, score: 3 }),
      ];
      const result = buildSkillScoreMatrix(scores, cycleKey);
      const serviceCategory = result.categories.find((c) => c.categoryId === 'service')!;
      const skill = serviceCategory.skills.find((s) => s.skillId === 'bh-short-service')!;
      expect(skill.latestScore).toBe(3); // Week 5 is the last non-null
    });

    it('should return null latestScore when no scores exist for a skill', () => {
      const result = buildSkillScoreMatrix([], cycleKey);
      const serviceCategory = result.categories.find((c) => c.categoryId === 'service')!;
      const skill = serviceCategory.skills.find((s) => s.skillId === 'bh-short-service')!;
      expect(skill.latestScore).toBeNull();
    });

    it('should use the highest week number non-null score as latestScore', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ skillId: 'bh-short-service', weekNumber: 8, score: 4 }),
        makeScore({ id: 'score-2', skillId: 'bh-short-service', weekNumber: 2, score: 1 }),
      ];
      const result = buildSkillScoreMatrix(scores, cycleKey);
      const serviceCategory = result.categories.find((c) => c.categoryId === 'service')!;
      const skill = serviceCategory.skills.find((s) => s.skillId === 'bh-short-service')!;
      expect(skill.latestScore).toBe(4); // Week 8 is the last
    });

    it('should handle score 0 as a valid latestScore (not treated as null)', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ skillId: 'bh-short-service', weekNumber: 1, score: 2 }),
        makeScore({ id: 'score-2', skillId: 'bh-short-service', weekNumber: 3, score: 0 }),
      ];
      const result = buildSkillScoreMatrix(scores, cycleKey);
      const serviceCategory = result.categories.find((c) => c.categoryId === 'service')!;
      const skill = serviceCategory.skills.find((s) => s.skillId === 'bh-short-service')!;
      expect(skill.latestScore).toBe(0); // Score 0 is valid, week 3 is last
    });
  });

  describe('metadata', () => {
    it('should use studentId from scores when not provided', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ studentId: 'student-42' }),
      ];
      const result = buildSkillScoreMatrix(scores, cycleKey);
      expect(result.studentId).toBe('student-42');
    });

    it('should use provided studentId when given', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ studentId: 'student-42' }),
      ];
      const result = buildSkillScoreMatrix(scores, cycleKey, 'student-99');
      expect(result.studentId).toBe('student-99');
    });

    it('should use empty string for studentId when no scores and not provided', () => {
      const result = buildSkillScoreMatrix([], cycleKey);
      expect(result.studentId).toBe('');
    });

    it('should set cycleKey on the result', () => {
      const result = buildSkillScoreMatrix([], 'Mar-Apr 2026');
      expect(result.cycleKey).toBe('Mar-Apr 2026');
    });
  });

  describe('category labels', () => {
    it('should produce correct category labels from SKILL_CATALOG', () => {
      const result = buildSkillScoreMatrix([], cycleKey);
      const labels = result.categories.map((c) => c.categoryLabel);
      expect(labels).toContain('Service');
      expect(labels).toContain('Service Return');
      expect(labels).toContain('Forehand (FH)');
      expect(labels).toContain('Round Head');
      expect(labels).toContain('Backhand (BH)');
    });
  });
});

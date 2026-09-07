/**
 * Tests for buildSkillScoreMatrix utility function.
 *
 * The matrix is built from the drills actually assigned in a student's
 * curriculum (weeks 1-8), not a fixed skill catalog — a skill only appears
 * on the heatmap if it was assigned as a drill at least once.
 */

import { describe, it, expect } from 'vitest';
import { buildSkillScoreMatrix } from './skillScoreMatrix';
import type { AssignedDrill } from './skillScoreMatrix';
import type { WeeklySkillScore } from '../constants/skillCatalog';

function makeScore(overrides: Partial<WeeklySkillScore> = {}): WeeklySkillScore {
  return {
    id: 'score-1',
    studentId: 'student-1',
    weekNumber: 1,
    cycleKey: 'Jan-Feb 2026',
    skillId: 'drill-1',
    skillName: 'Clear to Drop Combination',
    category: 'Combination Drills',
    score: 2,
    recordedBy: 'coach-1',
    recordedAt: new Date('2026-01-08T10:00:00Z'),
    ...overrides,
  };
}

const drillA: AssignedDrill = { id: 'drill-1', name: 'Clear to Drop Combination', category: 'Combination Drills' };
const drillB: AssignedDrill = { id: 'drill-2', name: 'Grip Practice', category: 'Fundamentals' };
const drillC: AssignedDrill = { id: 'drill-3', name: 'Shot Variation Drills', category: 'Combination Drills' };

describe('buildSkillScoreMatrix', () => {
  const cycleKey = 'Jan-Feb 2026';

  describe('structure with no assigned drills', () => {
    it('produces zero categories/skills when no drills are assigned', () => {
      const result = buildSkillScoreMatrix([], cycleKey, {});
      expect(result.categories).toHaveLength(0);
    });

    it('has weeks array with Week 1 through Week 8 regardless of drills', () => {
      const result = buildSkillScoreMatrix([], cycleKey, {});
      expect(result.weeks).toEqual([
        'Week 1', 'Week 2', 'Week 3', 'Week 4',
        'Week 5', 'Week 6', 'Week 7', 'Week 8',
      ]);
    });
  });

  describe('visibleWeekCount — only showing weeks that have actually happened', () => {
    it('truncates the weeks array to visibleWeekCount', () => {
      const result = buildSkillScoreMatrix([], cycleKey, {}, undefined, 3);
      expect(result.weeks).toEqual(['Week 1', 'Week 2', 'Week 3']);
    });

    it('truncates each skill row to visibleWeekCount score slots', () => {
      const result = buildSkillScoreMatrix([], cycleKey, { 1: [drillA] }, undefined, 3);
      expect(result.categories[0].skills[0].scores).toHaveLength(3);
    });

    it('ignores drills assigned beyond visibleWeekCount', () => {
      const result = buildSkillScoreMatrix([], cycleKey, { 1: [drillA], 5: [drillB] }, undefined, 3);
      const totalSkills = result.categories.reduce((sum, cat) => sum + cat.skills.length, 0);
      expect(totalSkills).toBe(1);
    });
  });

  describe('rows come from assigned drills, not a fixed catalog', () => {
    it('produces exactly one row per distinct assigned drill', () => {
      const result = buildSkillScoreMatrix([], cycleKey, { 1: [drillA, drillB] });
      const totalSkills = result.categories.reduce((sum, cat) => sum + cat.skills.length, 0);
      expect(totalSkills).toBe(2);
    });

    it('deduplicates a drill assigned in multiple weeks into a single row', () => {
      const result = buildSkillScoreMatrix([], cycleKey, { 1: [drillA], 2: [drillA] });
      const totalSkills = result.categories.reduce((sum, cat) => sum + cat.skills.length, 0);
      expect(totalSkills).toBe(1);
    });

    it('groups drills by their own category, ordered by first appearance', () => {
      const result = buildSkillScoreMatrix([], cycleKey, { 1: [drillB], 2: [drillA] });
      expect(result.categories.map((c) => c.categoryId)).toEqual(['Fundamentals', 'Combination Drills']);
    });

    it('places multiple drills of the same category together', () => {
      const result = buildSkillScoreMatrix([], cycleKey, { 1: [drillA, drillC] });
      const combo = result.categories.find((c) => c.categoryId === 'Combination Drills')!;
      expect(combo.skills.map((s) => s.skillId)).toEqual(['drill-1', 'drill-3']);
    });

    it('ignores drills assigned outside weeks 1-8', () => {
      const result = buildSkillScoreMatrix([], cycleKey, { 9: [drillA] });
      expect(result.categories).toHaveLength(0);
    });

    it('produces exactly 8 score slots per skill', () => {
      const result = buildSkillScoreMatrix([], cycleKey, { 1: [drillA] });
      expect(result.categories[0].skills[0].scores).toHaveLength(8);
    });

    it('sets all scores to null when no score data exists for an assigned drill', () => {
      const result = buildSkillScoreMatrix([], cycleKey, { 1: [drillA] });
      const skill = result.categories[0].skills[0];
      expect(skill.scores.every((s) => s === null)).toBe(true);
      expect(skill.latestScore).toBeNull();
    });
  });

  describe('score placement', () => {
    it('places a score in the correct (skill, week) cell', () => {
      const scores: WeeklySkillScore[] = [makeScore({ weekNumber: 3, score: 2 })];
      const result = buildSkillScoreMatrix(scores, cycleKey, { 1: [drillA] });
      const skill = result.categories[0].skills.find((s) => s.skillId === 'drill-1')!;
      expect(skill.scores[2]).toBe(2); // Week 3 is index 2
      expect(skill.scores[0]).toBeNull();
      expect(skill.scores[1]).toBeNull();
    });

    it('handles multiple scores for different weeks of the same skill', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ weekNumber: 1, score: 1 }),
        makeScore({ id: 'score-2', weekNumber: 4, score: 3 }),
        makeScore({ id: 'score-3', weekNumber: 7, score: 4 }),
      ];
      const result = buildSkillScoreMatrix(scores, cycleKey, { 1: [drillA] });
      const skill = result.categories[0].skills.find((s) => s.skillId === 'drill-1')!;
      expect(skill.scores[0]).toBe(1);
      expect(skill.scores[3]).toBe(3);
      expect(skill.scores[6]).toBe(4);
      expect(skill.scores[1]).toBeNull();
      expect(skill.scores[2]).toBeNull();
    });

    it('places scores for different drills in their correct categories', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ skillId: 'drill-1', weekNumber: 1, score: 2, category: 'Combination Drills' }),
        makeScore({ id: 'score-2', skillId: 'drill-2', weekNumber: 2, score: 3, category: 'Fundamentals' }),
      ];
      const result = buildSkillScoreMatrix(scores, cycleKey, { 1: [drillA, drillB] });

      const combo = result.categories.find((c) => c.categoryId === 'Combination Drills')!;
      const fundamentals = result.categories.find((c) => c.categoryId === 'Fundamentals')!;

      expect(combo.skills.find((s) => s.skillId === 'drill-1')!.scores[0]).toBe(2);
      expect(fundamentals.skills.find((s) => s.skillId === 'drill-2')!.scores[1]).toBe(3);
    });
  });

  describe('cycle filtering', () => {
    it('only includes scores matching the cycleKey parameter', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ weekNumber: 1, score: 2, cycleKey: 'Jan-Feb 2026' }),
        makeScore({ id: 'score-2', weekNumber: 2, score: 3, cycleKey: 'Mar-Apr 2026' }),
      ];
      const result = buildSkillScoreMatrix(scores, 'Jan-Feb 2026', { 1: [drillA] });
      const skill = result.categories[0].skills.find((s) => s.skillId === 'drill-1')!;
      expect(skill.scores[0]).toBe(2);
      expect(skill.scores[1]).toBeNull(); // Mar-Apr score filtered out
    });

    it('returns all nulls when no scores match the cycle', () => {
      const scores: WeeklySkillScore[] = [makeScore({ weekNumber: 1, score: 3, cycleKey: 'Mar-Apr 2026' })];
      const result = buildSkillScoreMatrix(scores, 'Jan-Feb 2026', { 1: [drillA] });
      const skill = result.categories[0].skills.find((s) => s.skillId === 'drill-1')!;
      expect(skill.scores.every((s) => s === null)).toBe(true);
    });
  });

  describe('latestScore computation', () => {
    it('computes latestScore as the last non-null value in week sequence', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ weekNumber: 1, score: 1 }),
        makeScore({ id: 'score-2', weekNumber: 3, score: 2 }),
        makeScore({ id: 'score-3', weekNumber: 5, score: 3 }),
      ];
      const result = buildSkillScoreMatrix(scores, cycleKey, { 1: [drillA] });
      const skill = result.categories[0].skills.find((s) => s.skillId === 'drill-1')!;
      expect(skill.latestScore).toBe(3); // Week 5 is the last non-null
    });

    it('handles score 0 as a valid latestScore (not treated as null)', () => {
      const scores: WeeklySkillScore[] = [
        makeScore({ weekNumber: 1, score: 2 }),
        makeScore({ id: 'score-2', weekNumber: 3, score: 0 }),
      ];
      const result = buildSkillScoreMatrix(scores, cycleKey, { 1: [drillA] });
      const skill = result.categories[0].skills.find((s) => s.skillId === 'drill-1')!;
      expect(skill.latestScore).toBe(0); // Score 0 is valid, week 3 is last
    });
  });

  describe('metadata', () => {
    it('uses studentId from scores when not provided', () => {
      const scores: WeeklySkillScore[] = [makeScore({ studentId: 'student-42' })];
      const result = buildSkillScoreMatrix(scores, cycleKey, { 1: [drillA] });
      expect(result.studentId).toBe('student-42');
    });

    it('uses provided studentId when given', () => {
      const scores: WeeklySkillScore[] = [makeScore({ studentId: 'student-42' })];
      const result = buildSkillScoreMatrix(scores, cycleKey, { 1: [drillA] }, 'student-99');
      expect(result.studentId).toBe('student-99');
    });

    it('uses empty string for studentId when no scores and not provided', () => {
      const result = buildSkillScoreMatrix([], cycleKey, {});
      expect(result.studentId).toBe('');
    });

    it('sets cycleKey on the result', () => {
      const result = buildSkillScoreMatrix([], 'Mar-Apr 2026', {});
      expect(result.cycleKey).toBe('Mar-Apr 2026');
    });
  });
});

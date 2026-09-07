/**
 * Skill Score Matrix Transformation
 *
 * Transforms flat API skill score records into the SkillScoreMatrix structure
 * used by the heatmap component for rendering.
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

import type {
  SkillScore,
  WeeklySkillScore,
  SkillScoreMatrix,
  SkillCategoryGroup,
  SkillRow,
} from '../constants/skillCatalog';

/** The minimal drill shape needed to place it on the matrix. */
export interface AssignedDrill {
  id: string;
  name: string;
  category: string;
}

/**
 * Transforms flat API scores into a SkillScoreMatrix structure grouped by
 * category.
 *
 * Rules:
 * 1. Rows come from the union of drills actually assigned across the visible
 *    weeks of the student's curriculum (`weeklyDrills`) — never a fixed
 *    skill catalog — so the heatmap only ever shows what the student was
 *    really assigned to practice, using this center's own drill names/categories.
 * 2. Produces one score slot per visible week, with null for unrecorded weeks.
 * 3. Only includes scores matching the `cycleKey` parameter.
 * 4. Places each score in the correct (skill, week) cell by matching
 *    `skillId` (the drill's id) and `weekNumber`.
 * 5. `latestScore` = last non-null value in the week sequence for each skill.
 * 6. `weeks` array = ['Week 1', ..., 'Week N'] where N = `visibleWeekCount`
 *    — for the cycle currently in progress this is capped to "as far as
 *    training has actually gotten" (see SkillProgressionTracker), so a
 *    brand-new student doesn't see 7 empty trailing week columns.
 * 7. Categories are ordered by first appearance across the visible weeks,
 *    matching however the coach actually organized the curriculum, rather
 *    than an arbitrary fixed order.
 */
export function buildSkillScoreMatrix(
  scores: WeeklySkillScore[],
  cycleKey: string,
  weeklyDrills: Partial<Record<number, AssignedDrill[]>>,
  studentId?: string,
  visibleWeekCount: number = 8
): SkillScoreMatrix {
  const weeks = Array.from({ length: visibleWeekCount }, (_, i) => `Week ${i + 1}`);

  // Filter scores to only those matching the selected cycle key
  const filteredScores = scores.filter((s) => s.cycleKey === cycleKey);

  // Build a lookup map for quick access: key = `${skillId}-${weekNumber}`
  const scoreMap = new Map<string, SkillScore>();
  for (const score of filteredScores) {
    scoreMap.set(`${score.skillId}-${score.weekNumber}`, score.score);
  }

  // Union of all drills assigned across the visible weeks, first-seen order
  // preserved, grouped by the drill's own category.
  const seenDrillIds = new Set<string>();
  const categoryOrder: string[] = [];
  const drillsByCategory = new Map<string, AssignedDrill[]>();

  for (let weekNumber = 1; weekNumber <= visibleWeekCount; weekNumber++) {
    for (const drill of weeklyDrills[weekNumber] ?? []) {
      if (seenDrillIds.has(drill.id)) continue;
      seenDrillIds.add(drill.id);
      if (!drillsByCategory.has(drill.category)) {
        drillsByCategory.set(drill.category, []);
        categoryOrder.push(drill.category);
      }
      drillsByCategory.get(drill.category)!.push(drill);
    }
  }

  const categories: SkillCategoryGroup[] = categoryOrder.map((category) => {
    const drills = drillsByCategory.get(category)!;
    const skills: SkillRow[] = drills.map((drill) => {
      const skillScores: (SkillScore | null)[] = weeks.map((_, weekIdx) => {
        const weekNumber = weekIdx + 1;
        return scoreMap.get(`${drill.id}-${weekNumber}`) ?? null;
      });

      let latestScore: SkillScore | null = null;
      for (let i = skillScores.length - 1; i >= 0; i--) {
        if (skillScores[i] !== null) {
          latestScore = skillScores[i];
          break;
        }
      }

      return {
        skillId: drill.id,
        skillName: drill.name,
        scores: skillScores,
        latestScore,
      };
    });

    return {
      categoryId: category,
      categoryLabel: category,
      skills,
    };
  });

  // Derive studentId from input scores if not provided
  const resolvedStudentId = studentId ?? scores[0]?.studentId ?? '';

  return {
    studentId: resolvedStudentId,
    cycleKey,
    weeks,
    categories,
  };
}

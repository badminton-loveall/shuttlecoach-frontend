/**
 * Skill Score Matrix Transformation
 *
 * Transforms flat API skill score records into the SkillScoreMatrix structure
 * used by the heatmap component for rendering.
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

import {
  SKILL_CATALOG,
  SkillCategory,
  SkillScore,
  WeeklySkillScore,
  SkillScoreMatrix,
  SkillCategoryGroup,
  SkillRow,
} from '../constants/skillCatalog';

/**
 * Transforms flat API scores into a SkillScoreMatrix structure grouped by category.
 *
 * Rules:
 * 1. Always produces ALL skills from SKILL_CATALOG regardless of whether data exists
 * 2. Produces exactly 8 score slots per skill (Week 1-8), with null for unrecorded weeks
 * 3. Only includes scores matching the `cycleKey` parameter
 * 4. Places each score in the correct (skill, week) cell by matching `skillId` and `weekNumber`
 * 5. `latestScore` = last non-null value in the week sequence for each skill
 * 6. `weeks` array = ['Week 1', 'Week 2', ..., 'Week 8']
 */
export function buildSkillScoreMatrix(
  scores: WeeklySkillScore[],
  cycleKey: string,
  studentId?: string
): SkillScoreMatrix {
  const weeks = [
    'Week 1',
    'Week 2',
    'Week 3',
    'Week 4',
    'Week 5',
    'Week 6',
    'Week 7',
    'Week 8',
  ];

  // Filter scores to only those matching the selected cycle key
  const filteredScores = scores.filter((s) => s.cycleKey === cycleKey);

  // Build a lookup map for quick access: key = `${skillId}-${weekNumber}`
  const scoreMap = new Map<string, SkillScore>();
  for (const score of filteredScores) {
    scoreMap.set(`${score.skillId}-${score.weekNumber}`, score.score);
  }

  // Transform catalog into category groups
  const categories: SkillCategoryGroup[] = Object.entries(SKILL_CATALOG).map(
    ([categoryId, categoryDef]) => {
      const skills: SkillRow[] = categoryDef.skills.map((skill) => {
        // Build 8 score slots for this skill
        const skillScores: (SkillScore | null)[] = weeks.map((_, weekIdx) => {
          const weekNumber = weekIdx + 1;
          const key = `${skill.id}-${weekNumber}`;
          return scoreMap.get(key) ?? null;
        });

        // Compute latestScore as the last non-null value in the week sequence
        let latestScore: SkillScore | null = null;
        for (let i = skillScores.length - 1; i >= 0; i--) {
          if (skillScores[i] !== null) {
            latestScore = skillScores[i];
            break;
          }
        }

        return {
          skillId: skill.id,
          skillName: skill.name,
          scores: skillScores,
          latestScore,
        };
      });

      return {
        categoryId: categoryId as SkillCategory,
        categoryLabel: categoryDef.label,
        skills,
      };
    }
  );

  // Derive studentId from input scores if not provided
  const resolvedStudentId = studentId ?? scores[0]?.studentId ?? '';

  return {
    studentId: resolvedStudentId,
    cycleKey,
    weeks,
    categories,
  };
}

import type { SkillAssessment, SkillScores } from '../types';

/**
 * Derives the current and previous assessment state from an array of assessments.
 * Sorts assessments by recordedAt descending to determine the most recent (current)
 * and second most recent (previous) assessments.
 *
 * @param assessments - Array of SkillAssessment objects
 * @returns Object containing currentScores, currentAssessment, and previousAssessment
 *
 * Validates: Requirements 2.5, 2.6
 */
export function deriveProgressState(assessments: SkillAssessment[]): {
  currentScores: SkillScores | null;
  currentAssessment: SkillAssessment | null;
  previousAssessment: SkillAssessment | null;
} {
  if (assessments.length === 0) {
    return {
      currentScores: null,
      currentAssessment: null,
      previousAssessment: null,
    };
  }

  // Sort by recordedAt descending (most recent first)
  const sorted = [...assessments].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );

  const currentAssessment = sorted[0];
  const previousAssessment = sorted.length >= 2 ? sorted[1] : null;
  const currentScores = currentAssessment.scores;

  return {
    currentScores,
    currentAssessment,
    previousAssessment,
  };
}

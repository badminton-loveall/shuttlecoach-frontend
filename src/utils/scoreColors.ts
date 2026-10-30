import type { SkillScore } from '../constants/skillCatalog';

/**
 * Score-to-color mapping utility for the Skill Progression Tracker heatmap.
 *
 * Validates: Requirements 6.5
 */

/** Color mapping for each score level */
const SCORE_COLORS: Record<SkillScore, string> = {
  0: '#F6E4E1',
  1: '#F3DCC4',
  2: '#EDD9B0',
  3: '#B9D3C2',
  4: '#2F6B4F',
};

/** Human-readable labels for each score level */
export const SCORE_LABELS: Record<SkillScore, string> = {
  0: "Don't Know",
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Pro',
};

/**
 * Returns the hex color for a given skill score.
 * Pure function with deterministic output.
 */
export function getScoreColor(score: SkillScore): string {
  return SCORE_COLORS[score];
}

/**
 * Returns the human-readable label for a given skill score.
 * Pure function with deterministic output.
 */
export function getScoreLabel(score: SkillScore): string {
  return SCORE_LABELS[score];
}

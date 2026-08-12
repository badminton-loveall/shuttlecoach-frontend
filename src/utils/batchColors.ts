/**
 * Batch color assignment and skill-level CSS class mapping utilities.
 *
 * - BATCH_COLOR_PALETTE: 6 visually distinct colors for coach calendar batches.
 * - assignBatchColors: deterministic color assignment based on sorted batch IDs.
 * - SKILL_LEVEL_CLASS_MAP: maps each SkillLevel to its DayCell CSS modifier class.
 */

import type { SkillLevel } from '../types';

/**
 * Predefined 6-color palette for coach batch colors.
 * Colors are chosen for visual distinctness in both light and dark themes.
 */
export const BATCH_COLOR_PALETTE = [
  '#3B82F6', // blue
  '#F97316', // orange
  '#8B5CF6', // purple
  '#10B981', // emerald
  '#EF4444', // red
  '#F59E0B', // amber
] as const;

/**
 * Assigns a consistent color to each batch based on sorted batch ID order.
 * Sorting guarantees the same batch always receives the same color regardless
 * of the order batches are fetched or passed in.
 * Cycles through the palette for >6 batches using modulo indexing.
 */
export function assignBatchColors(batchIds: string[]): Map<string, string> {
  const sorted = [...batchIds].sort();
  const map = new Map<string, string>();
  sorted.forEach((id, index) => {
    map.set(id, BATCH_COLOR_PALETTE[index % BATCH_COLOR_PALETTE.length]);
  });
  return map;
}

/**
 * Maps each SkillLevel to its corresponding DayCell CSS modifier class.
 * Used by the student calendar to apply skill-level-based highlight colors.
 */
export const SKILL_LEVEL_CLASS_MAP: Record<SkillLevel, string> = {
  Beginner: 'day-cell--skill-beginner',
  Intermediate: 'day-cell--skill-intermediate',
  Advanced: 'day-cell--skill-advanced',
  Professional: 'day-cell--skill-professional',
};

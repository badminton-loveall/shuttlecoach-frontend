/**
 * Drill Categories for the Drill Library
 *
 * 5 coach-defined drill categories used in the DrillLibrary component
 * for filtering and organizing 54 training drills.
 *
 * Requirements: 2.1
 */

// ─── Drill Category Type ─────────────────────────────────────────────────────

/** The 5 drill categories matching the coach's training taxonomy */
export type DrillCategory =
  | 'Service'
  | 'Service Return'
  | 'Forehand (FH)'
  | 'Round Head'
  | 'Backhand (BH)';

// ─── Drill Category Constants ────────────────────────────────────────────────

/** Ordered list of all 5 drill categories */
export const DRILL_CATEGORIES: DrillCategory[] = [
  'Service',
  'Service Return',
  'Forehand (FH)',
  'Round Head',
  'Backhand (BH)',
];

/** Display labels for each drill category */
export const DRILL_CATEGORY_LABELS: Record<DrillCategory, string> = {
  'Service': 'Service',
  'Service Return': 'Service Return',
  'Forehand (FH)': 'Forehand (FH)',
  'Round Head': 'Round Head',
  'Backhand (BH)': 'Backhand (BH)',
};

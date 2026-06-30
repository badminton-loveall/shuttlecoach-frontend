/**
 * Skill Assessment Utilities
 * Bi-monthly cycle key generation and category average calculation.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

/**
 * Bi-monthly cycle pairs indexed by month (0-11).
 * Each pair of months maps to the same cycle label.
 */
const CYCLE_LABELS: string[] = [
  'Jan-Feb', // January (0)
  'Jan-Feb', // February (1)
  'Mar-Apr', // March (2)
  'Mar-Apr', // April (3)
  'May-Jun', // May (4)
  'May-Jun', // June (5)
  'Jul-Aug', // July (6)
  'Jul-Aug', // August (7)
  'Sep-Oct', // September (8)
  'Sep-Oct', // October (9)
  'Nov-Dec', // November (10)
  'Nov-Dec', // December (11)
];

/**
 * Generates a bi-monthly cycle key string (e.g., "Jan-Feb 2026").
 * Uses the provided date or defaults to the current date.
 */
export function generateCycleKey(date?: Date): string {
  const d = date ?? new Date();
  const month = d.getMonth(); // 0-11
  const year = d.getFullYear();
  return `${CYCLE_LABELS[month]} ${year}`;
}

/**
 * Calculates the average of skill scores in a category, excluding scores of 0 (not tested).
 * Returns 0 if there are no tested scores.
 * Result is rounded to 1 decimal place.
 */
export function calculateCategoryAverage(scores: number[]): number {
  const testedScores = scores.filter((score) => score > 0);

  if (testedScores.length === 0) {
    return 0;
  }

  const sum = testedScores.reduce((acc, score) => acc + score, 0);
  return parseFloat((sum / testedScores.length).toFixed(1));
}

import { describe, it, expect } from 'vitest';
import { generateCycleKey, calculateCategoryAverage } from './skillUtils';

describe('generateCycleKey', () => {
  it('returns "Jan-Feb" for January', () => {
    expect(generateCycleKey(new Date(2026, 0, 15))).toBe('Jan-Feb 2026');
  });

  it('returns "Jan-Feb" for February', () => {
    expect(generateCycleKey(new Date(2026, 1, 10))).toBe('Jan-Feb 2026');
  });

  it('returns "Mar-Apr" for March', () => {
    expect(generateCycleKey(new Date(2026, 2, 1))).toBe('Mar-Apr 2026');
  });

  it('returns "Mar-Apr" for April', () => {
    expect(generateCycleKey(new Date(2026, 3, 30))).toBe('Mar-Apr 2026');
  });

  it('returns "May-Jun" for May', () => {
    expect(generateCycleKey(new Date(2025, 4, 5))).toBe('May-Jun 2025');
  });

  it('returns "May-Jun" for June', () => {
    expect(generateCycleKey(new Date(2025, 5, 20))).toBe('May-Jun 2025');
  });

  it('returns "Jul-Aug" for July', () => {
    expect(generateCycleKey(new Date(2025, 6, 1))).toBe('Jul-Aug 2025');
  });

  it('returns "Jul-Aug" for August', () => {
    expect(generateCycleKey(new Date(2025, 7, 31))).toBe('Jul-Aug 2025');
  });

  it('returns "Sep-Oct" for September', () => {
    expect(generateCycleKey(new Date(2025, 8, 15))).toBe('Sep-Oct 2025');
  });

  it('returns "Sep-Oct" for October', () => {
    expect(generateCycleKey(new Date(2025, 9, 1))).toBe('Sep-Oct 2025');
  });

  it('returns "Nov-Dec" for November', () => {
    expect(generateCycleKey(new Date(2025, 10, 1))).toBe('Nov-Dec 2025');
  });

  it('returns "Nov-Dec" for December', () => {
    expect(generateCycleKey(new Date(2025, 11, 25))).toBe('Nov-Dec 2025');
  });

  it('uses current date when no argument is provided', () => {
    const result = generateCycleKey();
    // Should return a string matching the pattern "Mon-Mon YYYY"
    expect(result).toMatch(/^(Jan-Feb|Mar-Apr|May-Jun|Jul-Aug|Sep-Oct|Nov-Dec) \d{4}$/);
  });
});

describe('calculateCategoryAverage', () => {
  it('returns 0 when all scores are 0', () => {
    expect(calculateCategoryAverage([0, 0, 0, 0, 0])).toBe(0);
  });

  it('returns 0 for an empty array', () => {
    expect(calculateCategoryAverage([])).toBe(0);
  });

  it('excludes 0 scores from the average', () => {
    // Only 3 and 4 are counted → (3 + 4) / 2 = 3.5
    expect(calculateCategoryAverage([0, 3, 0, 4, 0])).toBe(3.5);
  });

  it('calculates correct average with all non-zero scores', () => {
    // (1 + 2 + 3 + 4) / 4 = 2.5
    expect(calculateCategoryAverage([1, 2, 3, 4])).toBe(2.5);
  });

  it('rounds to 1 decimal place', () => {
    // (1 + 2 + 3) / 3 = 2.0
    expect(calculateCategoryAverage([1, 2, 3])).toBe(2);
    // (1 + 1 + 2) / 3 = 1.333... → 1.3
    expect(calculateCategoryAverage([1, 1, 2])).toBe(1.3);
  });

  it('handles a single non-zero score', () => {
    expect(calculateCategoryAverage([0, 0, 0, 0, 0, 0, 0, 0, 0, 4])).toBe(4);
  });

  it('handles all scores being the same non-zero value', () => {
    expect(calculateCategoryAverage([3, 3, 3, 3, 3])).toBe(3);
  });
});

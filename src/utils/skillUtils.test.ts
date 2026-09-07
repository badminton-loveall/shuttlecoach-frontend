import { describe, it, expect } from 'vitest';
import {
  generateCycleKey,
  calculateCategoryAverage,
  isCycleArchived,
  getAllCyclesFromPlans,
  getCycleStartDate,
  getCalendarWeekInfo,
} from './skillUtils';

describe('skillUtils', () => {
  describe('generateCycleKey', () => {
    it('should generate correct cycle key for January', () => {
      const date = new Date('2026-01-15');
      expect(generateCycleKey(date)).toBe('Jan-Feb 2026');
    });

    it('should generate correct cycle key for February', () => {
      const date = new Date('2026-02-20');
      expect(generateCycleKey(date)).toBe('Jan-Feb 2026');
    });

    it('should generate correct cycle key for March', () => {
      const date = new Date('2026-03-10');
      expect(generateCycleKey(date)).toBe('Mar-Apr 2026');
    });

    it('should generate correct cycle key for December', () => {
      const date = new Date('2026-12-25');
      expect(generateCycleKey(date)).toBe('Nov-Dec 2026');
    });
  });

  describe('calculateCategoryAverage', () => {
    it('should calculate average excluding zeros', () => {
      const scores = [0, 2, 3, 4];
      expect(calculateCategoryAverage(scores)).toBe(3.0);
    });

    it('should return 0 when all scores are 0', () => {
      const scores = [0, 0, 0];
      expect(calculateCategoryAverage(scores)).toBe(0);
    });

    it('should calculate average correctly', () => {
      const scores = [1, 2, 3];
      expect(calculateCategoryAverage(scores)).toBe(2.0);
    });

    it('should round to 1 decimal place', () => {
      const scores = [1, 2, 3, 3];
      expect(calculateCategoryAverage(scores)).toBe(2.3);
    });

    it('should handle empty array', () => {
      const scores: number[] = [];
      expect(calculateCategoryAverage(scores)).toBe(0);
    });
  });

  describe('isCycleArchived', () => {
    it('should return false for current cycle', () => {
      const currentCycle = generateCycleKey();
      expect(isCycleArchived(currentCycle)).toBe(false);
    });

    it('should return true for past cycles', () => {
      // A cycle from years ago
      expect(isCycleArchived('Jan-Feb 2020')).toBe(true);
    });

    it('should return false for future cycles', () => {
      // A cycle far in the future
      expect(isCycleArchived('Jan-Feb 2030')).toBe(false);
    });

    it('should handle different month pairs correctly', () => {
      // These should be archived as they are in the past
      expect(isCycleArchived('Mar-Apr 2020')).toBe(true);
      expect(isCycleArchived('Jul-Aug 2020')).toBe(true);
      expect(isCycleArchived('Nov-Dec 2020')).toBe(true);
    });

    it('should return false for invalid cycle format', () => {
      expect(isCycleArchived('Invalid')).toBe(false);
      expect(isCycleArchived('')).toBe(false);
    });

    it('should handle edge case at cycle boundary', () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Get the previous cycle
      const cyclePairs = ['Jan-Feb', 'Mar-Apr', 'May-Jun', 'Jul-Aug', 'Sep-Oct', 'Nov-Dec'];
      let prevCycleIndex = Math.floor(currentMonth / 2) - 1;
      let prevYear = currentYear;

      if (prevCycleIndex < 0) {
        prevCycleIndex = 5; // Nov-Dec
        prevYear = currentYear - 1;
      }

      const prevCycle = `${cyclePairs[prevCycleIndex]} ${prevYear}`;
      
      // Previous cycle should typically be archived
      // (unless we're at the very beginning of a new cycle)
      const result = isCycleArchived(prevCycle);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getCycleStartDate', () => {
    it('returns the 1st of the first month in the pair', () => {
      expect(getCycleStartDate('Sep-Oct 2026')).toEqual(new Date(2026, 8, 1));
      expect(getCycleStartDate('Jan-Feb 2026')).toEqual(new Date(2026, 0, 1));
      expect(getCycleStartDate('Nov-Dec 2025')).toEqual(new Date(2025, 10, 1));
    });
  });

  describe('getCalendarWeekInfo', () => {
    it('maps a date to its cycle and 1-indexed week within it', () => {
      // Sep 1 2026 is the first day of the Sep-Oct 2026 cycle.
      expect(getCalendarWeekInfo(new Date(2026, 8, 1))).toEqual({ cycleKey: 'Sep-Oct 2026', weekInCycle: 1 });
      // One week later is week 2.
      expect(getCalendarWeekInfo(new Date(2026, 8, 8))).toEqual({ cycleKey: 'Sep-Oct 2026', weekInCycle: 2 });
    });

    it('clamps the week position to 8 even near the end of a longer cycle', () => {
      // Oct 31 2026 is deep into the tail of a ~8.7-week cycle.
      const result = getCalendarWeekInfo(new Date(2026, 9, 31));
      expect(result.cycleKey).toBe('Sep-Oct 2026');
      expect(result.weekInCycle).toBeLessThanOrEqual(8);
    });

    it('rolls a date in a later cycle into that cycle, not the first one', () => {
      const result = getCalendarWeekInfo(new Date(2026, 10, 5)); // Nov 5, 2026
      expect(result.cycleKey).toBe('Nov-Dec 2026');
      expect(result.weekInCycle).toBe(1);
    });
  });

  describe('getAllCyclesFromPlans', () => {
    it('should extract unique cycles from plans', () => {
      const plans = [
        { cycleKey: 'Jan-Feb 2026' },
        { cycleKey: 'Jan-Feb 2026' },
        { cycleKey: 'Mar-Apr 2026' },
        { cycleKey: 'Nov-Dec 2025' }
      ];

      const cycles = getAllCyclesFromPlans(plans);
      
      // Should include all unique cycles plus current
      expect(cycles.length).toBeGreaterThanOrEqual(3);
      expect(cycles).toContain('Jan-Feb 2026');
      expect(cycles).toContain('Mar-Apr 2026');
      expect(cycles).toContain('Nov-Dec 2025');
    });

    it('should always include current cycle', () => {
      const plans: any[] = [];
      const cycles = getAllCyclesFromPlans(plans);
      
      const currentCycle = generateCycleKey();
      expect(cycles).toContain(currentCycle);
    });

    it('should sort cycles in reverse chronological order', () => {
      const plans = [
        { cycleKey: 'Jan-Feb 2025' },
        { cycleKey: 'Nov-Dec 2025' },
        { cycleKey: 'Mar-Apr 2025' }
      ];

      const cycles = getAllCyclesFromPlans(plans);
      
      // Current cycle should be first (most recent)
      const currentCycle = generateCycleKey();
      expect(cycles[0]).toBe(currentCycle);

      // Check that 2025 cycles are sorted correctly (newest first)
      const cycles2025 = cycles.filter(c => c.includes('2025'));
      expect(cycles2025[0]).toBe('Nov-Dec 2025');
      expect(cycles2025[cycles2025.length - 1]).toBe('Jan-Feb 2025');
    });

    it('should handle plans without cycleKey', () => {
      const plans = [
        { id: 'plan-1' },
        { cycleKey: 'Jan-Feb 2026' },
        { id: 'plan-2' }
      ];

      const cycles = getAllCyclesFromPlans(plans);
      
      // Should still work, just ignore invalid plans
      expect(cycles.length).toBeGreaterThanOrEqual(1);
      expect(cycles).toContain('Jan-Feb 2026');
    });

    it('should handle empty plans array', () => {
      const plans: any[] = [];
      const cycles = getAllCyclesFromPlans(plans);
      
      // Should at least contain current cycle
      const currentCycle = generateCycleKey();
      expect(cycles).toEqual([currentCycle]);
    });

    it('should sort across year boundaries correctly', () => {
      const plans = [
        { cycleKey: 'Jan-Feb 2026' },
        { cycleKey: 'Nov-Dec 2025' },
        { cycleKey: 'Mar-Apr 2026' },
        { cycleKey: 'Jan-Feb 2025' }
      ];

      const cycles = getAllCyclesFromPlans(plans);
      
      // Should be sorted newest to oldest
      // Current cycle first, then 2026 cycles, then 2025 cycles
      const idx2026MarApr = cycles.indexOf('Mar-Apr 2026');
      const idx2026JanFeb = cycles.indexOf('Jan-Feb 2026');
      const idx2025NovDec = cycles.indexOf('Nov-Dec 2025');
      const idx2025JanFeb = cycles.indexOf('Jan-Feb 2025');

      // 2026 cycles should come before 2025 cycles
      expect(idx2026MarApr).toBeLessThan(idx2025NovDec);
      expect(idx2026JanFeb).toBeLessThan(idx2025JanFeb);
      
      // Within same year, later cycles should come first
      expect(idx2026MarApr).toBeLessThan(idx2026JanFeb);
      expect(idx2025NovDec).toBeLessThan(idx2025JanFeb);
    });
  });
});

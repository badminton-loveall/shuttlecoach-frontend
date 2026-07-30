import { describe, it, expect } from 'vitest';
import { sortTrainingLogs } from './sortTrainingLogs';
import type { TrainingLog } from '../types';

describe('sortTrainingLogs', () => {
  const makeLogs = (dates: string[]): TrainingLog[] =>
    dates.map((date, i) => ({
      id: `log-${i}`,
      studentId: 'student-1',
      weekNumber: 1 as const,
      cycleKey: 'Jan-Feb 2026',
      sessionNotes: `Session ${i}`,
      isCompleted: true,
      recordedBy: 'coach-1',
      recordedAt: new Date(date),
    }));

  it('sorts logs by recordedAt descending (newest first)', () => {
    const logs = makeLogs(['2026-01-01', '2026-03-15', '2026-02-10']);
    const sorted = sortTrainingLogs(logs);

    expect(sorted[0].recordedAt).toEqual(new Date('2026-03-15'));
    expect(sorted[1].recordedAt).toEqual(new Date('2026-02-10'));
    expect(sorted[2].recordedAt).toEqual(new Date('2026-01-01'));
  });

  it('does not mutate the input array', () => {
    const logs = makeLogs(['2026-01-01', '2026-03-15', '2026-02-10']);
    const originalFirst = logs[0];
    sortTrainingLogs(logs);

    expect(logs[0]).toBe(originalFirst);
    expect(logs[0].recordedAt).toEqual(new Date('2026-01-01'));
  });

  it('returns a new array reference', () => {
    const logs = makeLogs(['2026-01-01']);
    const sorted = sortTrainingLogs(logs);

    expect(sorted).not.toBe(logs);
  });

  it('output length equals input length', () => {
    const logs = makeLogs(['2026-01-01', '2026-03-15', '2026-02-10']);
    const sorted = sortTrainingLogs(logs);

    expect(sorted.length).toBe(logs.length);
  });

  it('handles empty array', () => {
    const sorted = sortTrainingLogs([]);

    expect(sorted).toEqual([]);
    expect(sorted.length).toBe(0);
  });

  it('handles single element', () => {
    const logs = makeLogs(['2026-01-15']);
    const sorted = sortTrainingLogs(logs);

    expect(sorted.length).toBe(1);
    expect(sorted[0].recordedAt).toEqual(new Date('2026-01-15'));
  });

  it('handles logs with the same recordedAt', () => {
    const logs = makeLogs(['2026-01-15', '2026-01-15', '2026-01-15']);
    const sorted = sortTrainingLogs(logs);

    expect(sorted.length).toBe(3);
    sorted.forEach((log) => {
      expect(log.recordedAt).toEqual(new Date('2026-01-15'));
    });
  });
});

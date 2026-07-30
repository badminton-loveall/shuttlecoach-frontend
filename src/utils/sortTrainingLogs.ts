import type { TrainingLog } from '../types';

/**
 * Sorts training logs by recordedAt descending (newest first).
 * Returns a new array without mutating the input.
 *
 * Validates: Requirements 13.2
 */
export function sortTrainingLogs(logs: TrainingLog[]): TrainingLog[] {
  return [...logs].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
}

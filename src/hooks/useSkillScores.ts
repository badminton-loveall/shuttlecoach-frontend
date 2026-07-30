/**
 * useSkillScores Hook
 * Manages skill score fetching and recording for the Skill Progression Tracker.
 * Requirements: 6.1, 6.2, 8.5, 8.6, 10.1, 10.2
 *
 * - Fetches scores from GET /api/skill-scores with studentId and optional cycleKey
 * - Exposes scores, loading, error, availableCycles, recordScores, refetch
 * - recordScores calls POST /api/skill-scores and refetches on success
 */

import { useState, useEffect, useCallback } from 'react';
import type { WeeklySkillScore, SkillCategory, SkillScore } from '../constants/skillCatalog';
import apiClient from '../utils/apiClient';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface UseSkillScoresOptions {
  studentId: string;
  cycleKey?: string;
}

export interface RecordSkillScoresData {
  studentId: string;
  cycleKey: string;
  weekNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  scores: Array<{
    skillId: string;
    skillName: string;
    category: SkillCategory;
    score: SkillScore;
  }>;
}

export interface UseSkillScoresReturn {
  scores: WeeklySkillScore[];
  loading: boolean;
  error: string | null;
  availableCycles: string[];
  recordScores: (data: RecordSkillScoresData) => Promise<void>;
  refetch: () => Promise<void>;
}

// ─── Response Types ──────────────────────────────────────────────────────────

interface SkillScoresApiResponse {
  studentId: string;
  totalRecords: number;
  cycles: string[];
  scores: Array<Record<string, unknown>>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse a raw score record from the API response into a WeeklySkillScore,
 * ensuring Date fields are proper Date objects.
 */
function parseScoreRecord(raw: Record<string, unknown>): WeeklySkillScore {
  return {
    ...raw,
    recordedAt: new Date(raw.recordedAt as string),
  } as WeeklySkillScore;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Hook providing skill score operations for the Skill Progression Tracker.
 */
export function useSkillScores(options: UseSkillScoresOptions): UseSkillScoresReturn {
  const { studentId, cycleKey } = options;

  const [scores, setScores] = useState<WeeklySkillScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCycles, setAvailableCycles] = useState<string[]>([]);

  /**
   * Fetch skill scores from the API.
   */
  const fetchScores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('studentId', studentId);
      if (cycleKey) {
        params.append('cycleKey', cycleKey);
      }

      const response = await apiClient.get<SkillScoresApiResponse>(
        `/skill-scores?${params.toString()}`
      );

      const data = response.data;
      const parsedScores = data.scores.map(parseScoreRecord);

      setScores(parsedScores);
      setAvailableCycles(data.cycles ?? []);
    } catch (err) {
      console.error('Failed to fetch skill scores:', err);
      setError('Failed to load skill scores. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [studentId, cycleKey]);

  // Fetch scores on mount and when options change
  useEffect(() => {
    if (studentId) {
      void fetchScores();
    }
  }, [fetchScores, studentId]);

  /**
   * Record skill scores via POST /api/skill-scores.
   * On success, refetches the score list to reflect updated data.
   */
  const recordScores = useCallback(
    async (data: RecordSkillScoresData): Promise<void> => {
      try {
        await apiClient.post('/skill-scores', data);
        // Refetch scores to reflect the newly recorded data
        await fetchScores();
      } catch (err) {
        console.error('Failed to record skill scores:', err);
        throw err;
      }
    },
    [fetchScores]
  );

  return {
    scores,
    loading,
    error,
    availableCycles,
    recordScores,
    refetch: fetchScores,
  };
}

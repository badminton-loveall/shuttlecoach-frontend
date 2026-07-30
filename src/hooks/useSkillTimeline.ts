/**
 * useSkillTimeline Hook
 * Fetches and exposes a single skill's score history across all cycles
 * for timeline chart rendering.
 *
 * Requirements: 7.1, 10.4, 10.5
 */

import { useState, useEffect, useCallback } from 'react';
import type { SkillScore, SkillCategory } from '../constants/skillCatalog';
import apiClient from '../utils/apiClient';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SkillTimelinePoint {
  cycleKey: string;
  weekNumber: number;
  score: SkillScore;
  recordedAt: Date;
}

interface UseSkillTimelineOptions {
  studentId: string;
  skillId: string;
}

interface UseSkillTimelineReturn {
  timeline: SkillTimelinePoint[];
  skillName: string;
  category: SkillCategory;
  currentScore: SkillScore | null;
  loading: boolean;
  error: string | null;
}

/** Raw timeline point from API (dates as strings) */
interface ApiTimelinePoint {
  cycleKey: string;
  weekNumber: number;
  score: SkillScore;
  recordedAt: string;
}

/** API response shape for GET /api/skill-scores/timeline */
interface ApiTimelineResponse {
  studentId: string;
  skillId: string;
  skillName: string;
  category: SkillCategory;
  timeline: ApiTimelinePoint[];
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Hook providing a single skill's score timeline across all cycles.
 * Used by the SkillTimeline component for line chart rendering.
 */
export function useSkillTimeline({ studentId, skillId }: UseSkillTimelineOptions): UseSkillTimelineReturn {
  const [timeline, setTimeline] = useState<SkillTimelinePoint[]>([]);
  const [skillName, setSkillName] = useState<string>('');
  const [category, setCategory] = useState<SkillCategory>('service');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch timeline data from API
   */
  const fetchTimeline = useCallback(async () => {
    if (!studentId || !skillId) {
      setTimeline([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('studentId', studentId);
      params.append('skillId', skillId);

      const response = await apiClient.get<ApiTimelineResponse>(
        `/skill-scores/timeline?${params.toString()}`
      );

      const data = response.data;

      // Parse date strings into Date objects
      const parsedTimeline: SkillTimelinePoint[] = data.timeline.map((point) => ({
        cycleKey: point.cycleKey,
        weekNumber: point.weekNumber,
        score: point.score,
        recordedAt: new Date(point.recordedAt),
      }));

      setTimeline(parsedTimeline);
      setSkillName(data.skillName);
      setCategory(data.category);
    } catch (err) {
      console.error('Failed to fetch skill timeline:', err);
      setError('Failed to load skill timeline. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [studentId, skillId]);

  // Fetch timeline on mount and when params change
  useEffect(() => {
    void fetchTimeline();
  }, [fetchTimeline]);

  // Derive currentScore as the last timeline point's score (or null if empty)
  const currentScore: SkillScore | null =
    timeline.length > 0 ? timeline[timeline.length - 1].score : null;

  return {
    timeline,
    skillName,
    category,
    currentScore,
    loading,
    error,
  };
}

/**
 * SkillProgressionTracker Container Component
 *
 * Manages the internal state machine for the Skill Progression Tracker:
 * - heatmap: overview of all skills across weeks
 * - timeline: drill-down into a single skill's progression
 * - recording: form for entering weekly skill scores
 *
 * Requirements: 6.1, 6.7, 7.7
 */

import { useState, useCallback, useMemo } from 'react';
import { useSkillScores } from '../hooks/useSkillScores';
import type { RecordSkillScoresData } from '../hooks/useSkillScores';
import { useCurriculum } from '../hooks/useCurriculum';
import { generateCycleKey } from '../utils/skillUtils';
import { SKILL_CATALOG } from '../constants/skillCatalog';
import type { SkillCategory, SkillEntry } from '../constants/skillCatalog';
import { SkillTimeline } from './SkillTimeline';
import { SkillScoreInput } from './SkillScoreInput';

const CATEGORY_ORDER: SkillCategory[] = ['service', 'serviceReturn', 'forehand', 'roundHead', 'backhand'];

// ─── View State Machine ──────────────────────────────────────────────────────

type TrackerView =
  | { mode: 'heatmap' }
  | { mode: 'timeline'; skillId: string; skillName: string }
  | { mode: 'recording'; weekNumber: number };

// ─── Props ───────────────────────────────────────────────────────────────────

interface SkillProgressionTrackerProps {
  studentId: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SkillProgressionTracker({ studentId }: SkillProgressionTrackerProps) {
  // View state machine - default to heatmap
  const [view, setView] = useState<TrackerView>({ mode: 'heatmap' });

  // Cycle selection - default to current cycle
  const [selectedCycle, setSelectedCycle] = useState<string>(generateCycleKey());

  // Fetch skill scores with cycle filter
  const { scores, loading, error, availableCycles, recordScores, refetch } = useSkillScores({
    studentId,
    cycleKey: selectedCycle,
  });

  // The student's curriculum plan — NOT filtered by selectedCycle, since a
  // plan's own cycleKey is frozen to whatever cycle the student's enrollment
  // started in and just keeps accumulating weeks from there; it isn't "the
  // plan for cycle X" the way skill-score records are. Weeks here are
  // therefore numbered relative to the whole enrollment, not to selectedCycle.
  const { plans: curriculumPlans, loading: curriculumLoading } = useCurriculum({ studentId });
  const activePlan = useMemo(
    () => curriculumPlans.find((p) => !p.isArchived) ?? curriculumPlans[0],
    [curriculumPlans]
  );
  // The skill-scores API only accepts weekNumber 1-8 (it models one 8-week
  // cycle) while a curriculum plan can run to 52 weeks across an enrollment's
  // full lifetime — so only the plan's first 8 weeks are scoreable here today.
  const weekNumbers = useMemo(
    () =>
      activePlan
        ? [...activePlan.weeks.map((w) => w.weekNumber)].filter((n) => n >= 1 && n <= 8).sort((a, b) => a - b)
        : [],
    [activePlan]
  );

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  // Default to the most recent week defined in the plan rather than always
  // week 1, so a coach recording scores mid-program lands somewhere useful.
  const effectiveWeek = selectedWeek ?? (weekNumbers.length > 0 ? weekNumbers[weekNumbers.length - 1] : 1);

  // Skills scoreable for effectiveWeek, scoped to only what's actually
  // assigned as a drill that week — never the full 61-skill catalog.
  const assignedSkillsByCategory = useMemo(() => {
    const week = activePlan?.weeks.find((w) => w.weekNumber === effectiveWeek);
    const assignedDrillNames = new Set((week?.drills ?? []).map((d) => d.name.trim().toLowerCase()));
    const result = {} as Record<SkillCategory, readonly SkillEntry[]>;
    for (const category of CATEGORY_ORDER) {
      result[category] = SKILL_CATALOG[category].skills.filter((skill) =>
        assignedDrillNames.has(skill.name.trim().toLowerCase())
      );
    }
    return result;
  }, [activePlan, effectiveWeek]);

  // ─── Navigation Callbacks ────────────────────────────────────────────────

  /** Navigate from timeline back to heatmap */
  const handleBackToHeatmap = useCallback(() => {
    setView({ mode: 'heatmap' });
  }, []);

  /** Navigate to score recording mode */
  const handleRecordScores = useCallback(() => {
    setView({ mode: 'recording', weekNumber: effectiveWeek });
  }, [effectiveWeek]);

  /** Handle score recording save - records scores then returns to heatmap */
  const handleSaveScores = useCallback(
    async (data: RecordSkillScoresData) => {
      await recordScores(data);
      setView({ mode: 'heatmap' });
    },
    [recordScores]
  );

  /** Handle cancel from recording - return to heatmap */
  const handleCancelRecording = useCallback(() => {
    setView({ mode: 'heatmap' });
  }, []);

  /** Handle cycle change from CycleFilter */
  const handleCycleChange = useCallback((cycle: string) => {
    setSelectedCycle(cycle);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4" data-testid="skill-progression-tracker">
      {/* Cycle Filter Bar + Week Picker + Record Scores Button */}
      <div className="flex items-center justify-between gap-4" data-testid="tracker-toolbar">
        <div className="flex items-center gap-3">
          {/* CycleFilter placeholder - will be replaced by task 7.5 */}
          <div data-testid="cycle-filter">
            <select
              value={selectedCycle}
              onChange={(e) => handleCycleChange(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              aria-label="Select training cycle"
            >
              {availableCycles.length > 0 ? (
                availableCycles.map((cycle) => (
                  <option key={cycle} value={cycle}>
                    {cycle}
                  </option>
                ))
              ) : (
                <option value={selectedCycle}>{selectedCycle}</option>
              )}
            </select>
          </div>

          {!curriculumLoading && weekNumbers.length > 0 && (
            <div data-testid="week-filter">
              <select
                value={effectiveWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                aria-label="Select week"
              >
                {weekNumbers.map((weekNum) => (
                  <option key={weekNum} value={weekNum}>
                    Week {weekNum}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleRecordScores}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          data-testid="record-scores-button"
        >
          Record Scores
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8" data-testid="tracker-loading">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-green-600" />
          <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Loading skill scores...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300"
          data-testid="tracker-error"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 text-sm font-medium text-red-700 dark:text-red-300 underline hover:text-red-800 dark:hover:text-red-200"
          >
            Try again
          </button>
        </div>
      )}

      {/* Content Area - switches based on view mode */}
      {!loading && !error && (
        <div data-testid="tracker-content">
          {view.mode === 'heatmap' && (
            <div data-testid="heatmap-view">
              {/* SkillProgressHeatmap placeholder - will be implemented in task 7.2 */}
              <div
                data-testid="skill-progress-heatmap"
                data-scores={JSON.stringify(scores)}
                data-cycle={selectedCycle}
              >
                {/* Placeholder for SkillProgressHeatmap component */}
              </div>
            </div>
          )}

          {view.mode === 'timeline' && (
            <div data-testid="timeline-view">
              <SkillTimeline
                studentId={studentId}
                skillId={view.skillId}
                skillName={view.skillName}
                onBack={handleBackToHeatmap}
              />
            </div>
          )}

          {view.mode === 'recording' && (
            <div data-testid="recording-view">
              <SkillScoreInput
                studentId={studentId}
                cycleKey={selectedCycle}
                weekNumber={view.weekNumber as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
                assignedSkillsByCategory={assignedSkillsByCategory}
                curriculumLoading={curriculumLoading}
                onSave={handleSaveScores}
                onCancel={handleCancelRecording}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

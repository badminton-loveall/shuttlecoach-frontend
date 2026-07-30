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

import { useState, useCallback } from 'react';
import { useSkillScores } from '../hooks/useSkillScores';
import type { RecordSkillScoresData } from '../hooks/useSkillScores';
import { generateCycleKey } from '../utils/skillUtils';
import { SkillTimeline } from './SkillTimeline';

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

  // ─── Navigation Callbacks ────────────────────────────────────────────────

  /** Navigate from heatmap to timeline drill-down for a specific skill */
  const handleSkillClick = useCallback((skillId: string, skillName: string) => {
    setView({ mode: 'timeline', skillId, skillName });
  }, []);

  /** Navigate from timeline back to heatmap */
  const handleBackToHeatmap = useCallback(() => {
    setView({ mode: 'heatmap' });
  }, []);

  /** Navigate to score recording mode */
  const handleRecordScores = useCallback(() => {
    setView({ mode: 'recording', weekNumber: 1 });
  }, []);

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
      {/* Cycle Filter Bar + Record Scores Button */}
      <div className="flex items-center justify-between gap-4" data-testid="tracker-toolbar">
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
              {/* SkillScoreInput placeholder - will be implemented in task 7.4 */}
              <div
                data-testid="skill-score-input"
                data-student-id={studentId}
                data-cycle={selectedCycle}
                data-week-number={view.weekNumber}
              >
                {/* Placeholder for SkillScoreInput component */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveScores({
                      studentId,
                      cycleKey: selectedCycle,
                      weekNumber: view.weekNumber as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                      scores: [],
                    })}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    data-testid="save-scores-button"
                  >
                    Save Scores
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelRecording}
                    className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    data-testid="cancel-recording-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

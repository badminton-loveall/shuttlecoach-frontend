/**
 * SkillProgressionTracker Container Component
 *
 * Manages the internal state machine for the Skill Progression Tracker:
 * - heatmap: overview of all skills across weeks
 * - timeline: drill-down into a single skill's progression
 * - recording: form for entering weekly skill scores
 *
 * A student's training can run for years, so "week 1" can't mean "week 1 of
 * the curriculum" forever — this component resolves every curriculum week
 * (1, 40, 400...) to a real calendar date starting from the student's
 * enrollment date, and from there to "which bi-monthly cycle, and which week
 * of it" for scoring purposes. Browsing history is just picking an earlier
 * cycle from the cycle dropdown; there's no separate "long-term view" to build.
 *
 * Requirements: 6.1, 6.7, 7.7
 */

import { useState, useCallback, useMemo } from 'react';
import { useSkillScores } from '../hooks/useSkillScores';
import type { RecordSkillScoresData } from '../hooks/useSkillScores';
import { useCurriculum } from '../hooks/useCurriculum';
import { useStudentEnrollments } from '../hooks/useStudentEnrollments';
import { generateCycleKey, getCalendarWeekInfo } from '../utils/skillUtils';
import { buildSkillScoreMatrix } from '../utils/skillScoreMatrix';
import type { AssignedDrill } from '../utils/skillScoreMatrix';
import type { Drill } from '../types';
import { SkillTimeline } from './SkillTimeline';
import { SkillScoreInput } from './SkillScoreInput';
import { SkillProgressHeatmap } from './SkillProgressHeatmap';

// ─── View State Machine ──────────────────────────────────────────────────────

type TrackerView =
  | { mode: 'heatmap' }
  | { mode: 'timeline'; skillId: string; skillName: string }
  | { mode: 'recording'; weekNumber: number };

// ─── Props ───────────────────────────────────────────────────────────────────

interface SkillProgressionTrackerProps {
  studentId: string;
  /**
   * When true, this is being rendered in a display-only analytics context
   * (Skill Analytics tab) where recording new scores happens elsewhere (the
   * Progress tab's assessment flow) — hide the "Record Scores" entry point,
   * and if this student has no weekly drill scores recorded in any cycle
   * (nothing here that isn't already covered by Progress), render nothing
   * at all rather than an empty invitation to record.
   */
  readOnly?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SkillProgressionTracker({ studentId, readOnly = false }: SkillProgressionTrackerProps) {
  // View state machine - default to heatmap
  const [view, setView] = useState<TrackerView>({ mode: 'heatmap' });

  const todayCycle = generateCycleKey();
  // Cycle selection - default to the live/current cycle
  const [selectedCycle, setSelectedCycleState] = useState<string>(todayCycle);
  const isViewingCurrentCycle = selectedCycle === todayCycle;

  // Fetch skill scores with cycle filter
  const { scores, loading, error, availableCycles, recordScores, refetch } = useSkillScores({
    studentId,
    cycleKey: selectedCycle,
  });

  // The student's curriculum plan and enrollment start date — a plan's own
  // weeks just count up from day one of the enrollment (week 1, 2, 3, ...
  // indefinitely), with no inherent link to any bi-monthly cycle. Anchoring
  // each week to a real calendar date (enrollment start + 7 days per week)
  // is what lets a years-long program resolve correctly into "which cycle,
  // which week of it" below, however far along the student is.
  const { plans: curriculumPlans, loading: curriculumLoading } = useCurriculum({ studentId });
  const { activeEnrollment, loading: enrollmentLoading } = useStudentEnrollments(studentId);
  const activePlan = useMemo(
    () => curriculumPlans.find((p) => !p.isArchived) ?? curriculumPlans[0],
    [curriculumPlans]
  );
  const enrollmentStartDate = useMemo(
    () => (activeEnrollment?.startDate ? new Date(`${activeEnrollment.startDate}T00:00:00`) : null),
    [activeEnrollment]
  );

  // Every drill ever assigned in the curriculum, bucketed by which real
  // cycle and week-of-that-cycle it falls in. This is the one place that
  // reconciles the curriculum's enrollment-relative week numbers with the
  // skill tracker's calendar-cycle-relative ones.
  const drillsByCycleAndWeek = useMemo(() => {
    const map: Record<string, Partial<Record<number, Drill[]>>> = {};
    if (!activePlan) return map;
    // Falling back to today when there's no enrollment date yet keeps this
    // from throwing — it just means everything lands in the current cycle,
    // same as the old fixed 1-8 behavior, until a start date is set.
    const startDate = enrollmentStartDate ?? new Date();

    for (const week of activePlan.weeks) {
      const weekDate = new Date(startDate);
      weekDate.setDate(weekDate.getDate() + (week.weekNumber - 1) * 7);
      const { cycleKey, weekInCycle } = getCalendarWeekInfo(weekDate);
      const bucket = (map[cycleKey] ??= {});
      // A cycle can run slightly over 8 calendar weeks, so the tail end
      // clamps into week 8 (see getCalendarWeekInfo) — merge rather than
      // overwrite so that clamped week's own drills aren't lost.
      bucket[weekInCycle] = [...(bucket[weekInCycle] ?? []), ...week.drills];
    }
    return map;
  }, [activePlan, enrollmentStartDate]);

  const weeklyDrills = drillsByCycleAndWeek[selectedCycle] ?? {};

  // How many week columns/options make sense for the cycle being viewed:
  // the live cycle only shows as far as training has actually gotten (no
  // empty trailing weeks that haven't happened yet); any other (necessarily
  // past) cycle shows its full 8 weeks.
  const visibleWeekCount = isViewingCurrentCycle
    ? getCalendarWeekInfo(new Date()).weekInCycle
    : 8;
  const weekOptions = useMemo(
    () => Array.from({ length: visibleWeekCount }, (_, i) => i + 1),
    [visibleWeekCount]
  );

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  // Default to "now" — the current week of the cycle being viewed — rather
  // than always week 1, so a coach recording scores lands somewhere useful
  // regardless of how far into the program the student already is.
  const effectiveWeek = selectedWeek ?? visibleWeekCount;

  // Drills assigned for effectiveWeek, grouped by the drill's own category —
  // what the recording view scores against.
  const assignedDrillsByCategory = useMemo(() => {
    const drills = weeklyDrills[effectiveWeek] ?? [];
    const result: Record<string, Drill[]> = {};
    for (const drill of drills) {
      (result[drill.category] ??= []).push(drill);
    }
    return result;
  }, [weeklyDrills, effectiveWeek]);

  // Heatmap matrix, built from the union of drills assigned across the
  // visible weeks of the cycle being viewed.
  const matrix = useMemo(
    () =>
      buildSkillScoreMatrix(
        scores,
        selectedCycle,
        weeklyDrills as Partial<Record<number, AssignedDrill[]>>,
        studentId,
        visibleWeekCount
      ),
    [scores, selectedCycle, weeklyDrills, studentId, visibleWeekCount]
  );

  // ─── Navigation Callbacks ────────────────────────────────────────────────

  /** Navigate to a skill's timeline from the heatmap */
  const handleSkillClick = useCallback((skillId: string, skillName: string) => {
    setView({ mode: 'timeline', skillId, skillName });
  }, []);

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

  /** Handle cycle change from CycleFilter — reset the week choice, since a
   *  week number picked in one cycle has no bearing on another. */
  const handleCycleChange = useCallback((cycle: string) => {
    setSelectedCycleState(cycle);
    setSelectedWeek(null);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  // Recording happens in the Progress tab now. In a read-only analytics
  // context, once we know (post-load) this student has never had a weekly
  // drill score recorded in any cycle, there's nothing here that isn't
  // already covered by Progress — render nothing rather than an empty card
  // whose only content is an invitation to record.
  if (readOnly && !loading && !error && availableCycles.length === 0) {
    return null;
  }

  return (
    <div className="card-base" data-testid="skill-progression-tracker">
      <h3 className="font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
        Weekly Progression
      </h3>
      <div className="space-y-4">
      {/* Cycle Filter Bar + Week Picker + Record Scores Button */}
      <div className="flex items-center justify-between gap-4" data-testid="tracker-toolbar">
        <div className="flex items-center gap-3">
          {/* CycleFilter placeholder - will be replaced by task 7.5 */}
          <div data-testid="cycle-filter">
            <select
              value={selectedCycle}
              onChange={(e) => handleCycleChange(e.target.value)}
              className="form-input text-sm"
              style={{ width: 'auto' }}
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

          {!curriculumLoading && !enrollmentLoading && weekOptions.length > 0 && (
            <div data-testid="week-filter">
              <select
                value={effectiveWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="form-input text-sm"
                style={{ width: 'auto' }}
                aria-label="Select week"
              >
                {weekOptions.map((weekNum) => (
                  <option key={weekNum} value={weekNum}>
                    Week {weekNum}
                    {isViewingCurrentCycle && weekNum === visibleWeekCount ? ' (current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleRecordScores}
            className="btn-create-fee"
            data-testid="record-scores-button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Record Scores
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8" data-testid="tracker-loading">
          <div className="h-8 w-8 animate-spin rounded-full" style={{ border: '4px solid var(--border-default)', borderTopColor: 'var(--color-primary)' }} />
          <span className="ml-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading skill scores...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="alert-base alert-danger" data-testid="tracker-error">
          <div className="alert-base__content">
            <p className="alert-base__message">{error}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="table-action-link table-action-link--danger"
              style={{ padding: '4px 0', marginTop: 'var(--space-xs)' }}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Content Area - switches based on view mode */}
      {!loading && !error && (
        <div data-testid="tracker-content">
          {view.mode === 'heatmap' && (
            <div data-testid="heatmap-view">
              {matrix.categories.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  No drills assigned yet in this student's curriculum — assign some in Manage Curriculum
                  to start tracking skill progress here.
                </p>
              ) : (
                <SkillProgressHeatmap matrix={matrix} onSkillClick={handleSkillClick} />
              )}
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
                assignedDrillsByCategory={assignedDrillsByCategory}
                curriculumLoading={curriculumLoading}
                onSave={handleSaveScores}
                onCancel={handleCancelRecording}
              />
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

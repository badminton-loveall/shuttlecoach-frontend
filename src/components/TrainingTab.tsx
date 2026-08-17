import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBatchStudentsDrills } from '../hooks/useBatchStudentsDrills';
import { useSkillScores } from '../hooks/useSkillScores';
import { generateCycleKey } from '../utils/skillUtils';
import { DrillSkillsMatrix } from './DrillSkillsMatrix';
import { TrainingHistoryPanel } from './TrainingHistoryPanel';
import type { Student } from '../types';
import type { SkillCategory, SkillScore } from '../constants/skillCatalog';
import './TrainingTab.css';

/**
 * TrainingTab Component
 *
 * Composes the redesigned training tab:
 * 1. Drill Skills Matrix (tap-to-set scoring grid)
 * 2. Training History Panel (per-drill, expandable)
 * 3. Curriculum Drills List (grouped by focus area)
 * 4. Strengths / Weaknesses / Coach Feedback (tag-based)
 *
 * Requirements: 1.1, 7.1, 7.2, 7.3, 7.4
 */

interface TrainingTabProps {
  student: Student;
  onUpdateStrengths?: (strengths: string[]) => void;
  onUpdateWeaknesses?: (weaknesses: string[]) => void;
  onUpdateFeedback?: (feedback: string) => void;
}

export const TrainingTab: React.FC<TrainingTabProps> = ({
  student,
  onUpdateStrengths,
  onUpdateWeaknesses,
  onUpdateFeedback,
}) => {
  const { role } = useAuth();
  const isCoach = role === 'HEAD_COACH' || role === 'ASSISTANT_COACH';

  // ─── Data fetching ───────────────────────────────────────────────────────

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentCycleKey = useMemo(() => generateCycleKey(), []);

  const {
    students: batchStudents,
    loading: drillsLoading,
    error: drillsError,
    refetch: refetchDrills,
  } = useBatchStudentsDrills({
    batchId: student.batchId || '',
    date: today,
  });

  const {
    scores: skillScores,
    loading: scoresLoading,
    error: scoresError,
    recordScores,
    refetch: refetchScores,
  } = useSkillScores({ studentId: student.id });

  // ─── Derived data ────────────────────────────────────────────────────────

  // Extract curriculum drills for the current student from batch data
  const curriculumDrills = useMemo(() => {
    const studentData = batchStudents.find((s) => s.studentId === student.id);
    return studentData?.drills ?? [];
  }, [batchStudents, student.id]);

  // Build a drillName → latest score map from the scores array
  const drillScoreMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of skillScores) {
      // Use the most recent score per skillId (scores are sorted by recency from API)
      if (!(entry.skillId in map)) {
        map[entry.skillId] = entry.score;
      }
    }
    return map;
  }, [skillScores]);

  // ─── Selected drill state (training history) ─────────────────────────────

  const [selectedDrillId, setSelectedDrillId] = useState<string | null>(null);

  const handleDrillSelect = useCallback((drillName: string) => {
    setSelectedDrillId((prev) => (prev === drillName ? null : drillName));
  }, []);

  // Training dates for the selected drill
  const trainingDatesForDrill = useMemo(() => {
    if (!selectedDrillId) return [];
    return skillScores
      .filter((s) => s.skillId === selectedDrillId || s.skillName === selectedDrillId)
      .map((s) => ({ date: s.recordedAt.toISOString(), score: s.score }));
  }, [selectedDrillId, skillScores]);

  // ─── Score change handler ────────────────────────────────────────────────

  const handleScoreChange = useCallback(
    async (drillName: string, score: number) => {
      // Find the drill's focus area for the category field
      const drill = curriculumDrills.find((d) => d.name === drillName);
      const category = (drill?.focusArea || 'forehand') as SkillCategory;

      await recordScores({
        studentId: student.id,
        cycleKey: currentCycleKey,
        weekNumber: 1,
        scores: [
          {
            skillId: drillName,
            skillName: drillName,
            category,
            score: score as SkillScore,
          },
        ],
      });
    },
    [curriculumDrills, recordScores, student.id, currentCycleKey]
  );

  // ─── Error / retry handling ──────────────────────────────────────────────

  const hasConsolidatedError = !!(drillsError && scoresError);

  const handleRetry = useCallback(() => {
    void refetchDrills();
    void refetchScores();
  }, [refetchDrills, refetchScores]);

  // ─── Strengths / Weaknesses / Feedback ───────────────────────────────────

  const [strengths, setStrengths] = useState<string[]>(student.strengths);
  const [weaknesses, setWeaknesses] = useState<string[]>(student.weaknesses);
  const [feedback, setFeedback] = useState<string>(student.coachFeedback || '');
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');

  const handleAddStrength = () => {
    const trimmed = newStrength.trim();
    if (!trimmed) return;
    if (strengths.includes(trimmed)) return;
    const updated = [...strengths, trimmed];
    setStrengths(updated);
    setNewStrength('');
    onUpdateStrengths?.(updated);
  };

  const handleRemoveStrength = (tag: string) => {
    const updated = strengths.filter((s) => s !== tag);
    setStrengths(updated);
    onUpdateStrengths?.(updated);
  };

  const handleAddWeakness = () => {
    const trimmed = newWeakness.trim();
    if (!trimmed) return;
    if (weaknesses.includes(trimmed)) return;
    const updated = [...weaknesses, trimmed];
    setWeaknesses(updated);
    setNewWeakness('');
    onUpdateWeaknesses?.(updated);
  };

  const handleRemoveWeakness = (tag: string) => {
    const updated = weaknesses.filter((w) => w !== tag);
    setWeaknesses(updated);
    onUpdateWeaknesses?.(updated);
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value);
    onUpdateFeedback?.(e.target.value);
  };

  const handleStrengthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddStrength();
    }
  };

  const handleWeaknessKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddWeakness();
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="training-tab" data-testid="training-tab">
      <h2 className="tab-section-title">Training Overview</h2>

      {/* Consolidated error state when both APIs fail */}
      {hasConsolidatedError && (
        <div className="training-error-state" data-testid="training-consolidated-error">
          <p className="training-error-state__text">
            Unable to load training data. Please check your connection and try again.
          </p>
          <button
            className="training-error-state__retry"
            onClick={handleRetry}
            type="button"
            data-testid="training-retry-button"
          >
            Retry
          </button>
        </div>
      )}

      {/* Section 1: Drill Skills Matrix */}
      {!hasConsolidatedError && (
        <section className="training-section" data-testid="drill-skills-matrix-section">
          <h3 className="training-tab-heading">Skill Scores</h3>
          {scoresError && !drillsError && (
            <div className="training-error-state" data-testid="scores-error">
              <p className="training-error-state__text">{scoresError}</p>
            </div>
          )}
          <DrillSkillsMatrix
            drills={curriculumDrills}
            scores={drillScoreMap}
            onScoreChange={handleScoreChange}
            readOnly={!isCoach}
            onDrillSelect={handleDrillSelect}
            selectedDrill={selectedDrillId}
            loading={scoresLoading || drillsLoading}
          />
        </section>
      )}

      {/* Section 2: Training History (shown when a drill is selected) */}
      {selectedDrillId && !hasConsolidatedError && (
        <section className="training-section" data-testid="training-history-section">
          <TrainingHistoryPanel
            drillName={selectedDrillId}
            trainingDates={trainingDatesForDrill}
            isOpen={true}
          />
        </section>
      )}

      {/* Section 4: Strengths / Weaknesses / Feedback */}
      <div className="training-tab-sections">
        {/* Strengths Section */}
        <div className="tag-section" data-testid="strengths-section">
          <h3 className="training-tab-heading">Strengths</h3>
          <div className="tag-list">
            {strengths.map((strength) => (
              <span key={strength} className="tag-strength" data-testid="strength-tag">
                {strength}
                {isCoach && (
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveStrength(strength)}
                    aria-label={`Remove strength: ${strength}`}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {strengths.length === 0 && (
              <span className="tag-empty">No strengths added yet</span>
            )}
          </div>
          {isCoach && (
            <div className="tag-input-group" data-testid="add-strength-input">
              <input
                type="text"
                className="tag-input"
                placeholder="Add a strength..."
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                onKeyDown={handleStrengthKeyDown}
                aria-label="New strength"
              />
              <button
                className="tag-add-btn tag-add-btn-strength"
                onClick={handleAddStrength}
                type="button"
                disabled={!newStrength.trim()}
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Weaknesses Section */}
        <div className="tag-section" data-testid="weaknesses-section">
          <h3 className="training-tab-heading">Areas to Improve</h3>
          <div className="tag-list">
            {weaknesses.map((weakness) => (
              <span key={weakness} className="tag-weakness" data-testid="weakness-tag">
                {weakness}
                {isCoach && (
                  <button
                    className="tag-remove"
                    onClick={() => handleRemoveWeakness(weakness)}
                    aria-label={`Remove weakness: ${weakness}`}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {weaknesses.length === 0 && (
              <span className="tag-empty">No weaknesses added yet</span>
            )}
          </div>
          {isCoach && (
            <div className="tag-input-group" data-testid="add-weakness-input">
              <input
                type="text"
                className="tag-input"
                placeholder="Add a weakness..."
                value={newWeakness}
                onChange={(e) => setNewWeakness(e.target.value)}
                onKeyDown={handleWeaknessKeyDown}
                aria-label="New weakness"
              />
              <button
                className="tag-add-btn tag-add-btn-weakness"
                onClick={handleAddWeakness}
                type="button"
                disabled={!newWeakness.trim()}
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Coach Feedback Section */}
        <div className="feedback-section" data-testid="feedback-section">
          <h3 className="training-tab-heading">Coach Feedback</h3>
          {isCoach ? (
            <textarea
              className="coach-feedback-textarea"
              value={feedback}
              onChange={handleFeedbackChange}
              placeholder="Write feedback for this student..."
              rows={5}
              aria-label="Coach feedback"
              data-testid="coach-feedback-textarea"
            />
          ) : (
            <p className="coach-feedback-text" data-testid="coach-feedback-readonly">
              {feedback || 'No feedback available yet.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingTab;

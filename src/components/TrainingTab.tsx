import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTrainingLogs } from '../hooks/useTrainingLogs';
import { useCurriculum } from '../hooks/useCurriculum';
import { generateCycleKey } from '../utils/skillUtils';
import { sortTrainingLogs } from '../utils/sortTrainingLogs';
import { formatAuditTimestamp } from '../utils/dateUtils';
import type { Student, TrainingLog, CurriculumPlan } from '../types';
import './TrainingTab.css';

/**
 * TrainingTab Component
 * Displays training logs (from API via useTrainingLogs), curriculum summary (from API via useCurriculum),
 * and existing strengths/weaknesses/coach feedback.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
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

  // Fetch training logs and curriculum from API
  const { logs, loading: logsLoading, error: logsError } = useTrainingLogs({ studentId: student.id });
  const { plans, loading: curriculumLoading, error: curriculumError } = useCurriculum({ studentId: student.id });

  // Strengths/weaknesses/feedback local state (preserved from existing implementation)
  const [strengths, setStrengths] = useState<string[]>(student.strengths);
  const [weaknesses, setWeaknesses] = useState<string[]>(student.weaknesses);
  const [feedback, setFeedback] = useState<string>(student.coachFeedback || '');
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');

  // Derive current cycle key
  const currentCycleKey = useMemo(() => generateCycleKey(), []);

  // Sort logs and group by cycle
  const sortedLogs = useMemo(() => sortTrainingLogs(logs), [logs]);

  const logsByCycle = useMemo(() => {
    const grouped: Record<string, TrainingLog[]> = {};
    for (const log of sortedLogs) {
      if (!grouped[log.cycleKey]) {
        grouped[log.cycleKey] = [];
      }
      grouped[log.cycleKey].push(log);
    }
    return grouped;
  }, [sortedLogs]);

  // Get cycle keys sorted with current cycle first
  const cycleKeys = useMemo(() => {
    const keys = Object.keys(logsByCycle);
    return keys.sort((a, b) => {
      if (a === currentCycleKey) return -1;
      if (b === currentCycleKey) return 1;
      return 0;
    });
  }, [logsByCycle, currentCycleKey]);

  // Find active curriculum plan
  const activePlan: CurriculumPlan | undefined = useMemo(
    () => plans.find((p) => p.cycleKey === currentCycleKey && !p.isArchived),
    [plans, currentCycleKey]
  );

  // Strengths/weaknesses handlers
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

  return (
    <div className="training-tab" data-testid="training-tab">
      <h2 className="tab-section-title">Training Overview</h2>

      {/* Training Logs Section */}
      <div className="mb-6" data-testid="training-logs-section">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Training Logs</h3>

        {logsLoading && (
          <div className="flex items-center justify-center py-8" data-testid="training-logs-loading">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 dark:border-green-400" />
            <span className="ml-3 text-gray-500 dark:text-gray-400">Loading training logs...</span>
          </div>
        )}

        {logsError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg" data-testid="training-logs-error">
            <p className="text-red-600 dark:text-red-400 text-sm">{logsError}</p>
          </div>
        )}

        {!logsLoading && !logsError && logs.length === 0 && (
          <div className="p-6 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" data-testid="training-logs-empty">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No training logs recorded yet for this student.</p>
          </div>
        )}

        {!logsLoading && !logsError && logs.length > 0 && (
          <div className="space-y-4" data-testid="training-logs-list">
            {cycleKeys.map((cycleKey) => (
              <div
                key={cycleKey}
                className={`rounded-lg border ${
                  cycleKey === currentCycleKey
                    ? 'border-green-300 dark:border-green-500/50 bg-green-50 dark:bg-green-900/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                } p-4`}
                data-testid={`cycle-group-${cycleKey}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{cycleKey}</h4>
                  {cycleKey === currentCycleKey && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full" data-testid="current-cycle-badge">
                      Current
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {logsByCycle[cycleKey].map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                      data-testid={`training-log-${log.id}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          log.isCompleted ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          W{log.weekNumber}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{log.sessionNotes}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                          <span>{formatAuditTimestamp(log.recordedAt)}</span>
                          <span>·</span>
                          <span>{log.recordedBy}</span>
                          {log.isCompleted && (
                            <>
                              <span>·</span>
                              <span className="text-green-600 dark:text-green-400">Completed</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Curriculum Summary Section */}
      <div className="mb-6" data-testid="curriculum-section">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Curriculum</h3>

        {curriculumLoading && (
          <div className="flex items-center justify-center py-8" data-testid="curriculum-loading">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400" />
            <span className="ml-3 text-gray-500 dark:text-gray-400">Loading curriculum...</span>
          </div>
        )}

        {curriculumError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg" data-testid="curriculum-error">
            <p className="text-red-600 dark:text-red-400 text-sm">{curriculumError}</p>
          </div>
        )}

        {!curriculumLoading && !curriculumError && !activePlan && (
          <div className="p-6 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" data-testid="curriculum-empty">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No curriculum plan found for the current cycle ({currentCycleKey}).</p>
          </div>
        )}

        {!curriculumLoading && !curriculumError && activePlan && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800" data-testid="curriculum-plan">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {activePlan.cycleKey} Plan
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {activePlan.weeks.length} weeks planned
              </span>
            </div>
            <div className="space-y-2">
              {activePlan.weeks.slice(0, 4).map((week) => (
                <div
                  key={week.weekNumber}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-500 w-8">
                    W{week.weekNumber}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{week.focusArea}</span>
                </div>
              ))}
              {activePlan.weeks.length > 4 && (
                <p className="text-xs text-gray-500 dark:text-gray-500 pl-11">
                  +{activePlan.weeks.length - 4} more weeks
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Existing Strengths/Weaknesses/Feedback Sections */}
      <div className="training-tab-sections">
        {/* Strengths Section */}
        <div className="tag-section" data-testid="strengths-section">
          <h3 className="tag-section-title">Strengths</h3>
          <div className="tag-list">
            {strengths.map((strength) => (
              <span key={strength} className="tag tag-strength" data-testid="strength-tag">
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
          <h3 className="tag-section-title">Areas to Improve</h3>
          <div className="tag-list">
            {weaknesses.map((weakness) => (
              <span key={weakness} className="tag tag-weakness" data-testid="weakness-tag">
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
          <h3 className="tag-section-title">Coach Feedback</h3>
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

/**
 * SkillScoreInput Component
 *
 * A form for coaches to record weekly skill scores for a student.
 * Displays all 62 skills in collapsible category sections with 0-4 button selectors.
 * Pre-fills with previous week's scores as a baseline, highlights changes
 * (green for improvement, red for regression), and validates before submission.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
 */

import { useState, useCallback } from 'react';
import { SKILL_CATALOG, type SkillCategory, type SkillScore } from '../constants/skillCatalog';
import { getScoreColor, SCORE_LABELS } from '../utils/scoreColors';

// ─── Types ───────────────────────────────────────────────────────────────────

type WeekNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface SkillScoreInputProps {
  studentId: string;
  cycleKey: string;
  weekNumber: WeekNumber;
  previousScores?: Record<string, SkillScore>;
  onSave: (scores: Array<{ skillId: string; skillName: string; category: SkillCategory; score: SkillScore }>) => Promise<void>;
  onCancel: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SkillScoreInput({
  studentId: _studentId,
  cycleKey: _cycleKey,
  weekNumber: initialWeekNumber,
  previousScores,
  onSave,
  onCancel,
}: SkillScoreInputProps) {
  // Local score state: null means not scored this week
  const [scores, setScores] = useState<Record<string, SkillScore | null>>({});
  const [selectedWeek, setSelectedWeek] = useState<WeekNumber>(initialWeekNumber);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ─── Score Change Handlers ─────────────────────────────────────────────

  const handleScoreChange = useCallback((skillId: string, score: SkillScore) => {
    setScores((prev) => ({
      ...prev,
      [skillId]: prev[skillId] === score ? null : score, // Toggle off if same score clicked
    }));
  }, []);

  const handleCopyFromLastWeek = useCallback(() => {
    if (!previousScores) return;
    const copied: Record<string, SkillScore | null> = {};
    Object.entries(previousScores).forEach(([skillId, score]) => {
      copied[skillId] = score;
    });
    setScores(copied);
  }, [previousScores]);

  const handleToggleCategory = useCallback((categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  }, []);

  const handleWeekChange = useCallback((week: WeekNumber) => {
    setSelectedWeek(week);
  }, []);

  // ─── Save Handler ──────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    // Validate week number
    if (selectedWeek < 1 || selectedWeek > 8) {
      setErrorMessage('Week number must be between 1 and 8.');
      return;
    }

    // Collect only skills that have a score assigned
    const scoredEntries: Array<{ skillId: string; skillName: string; category: SkillCategory; score: SkillScore }> = [];

    for (const [categoryId, categoryDef] of Object.entries(SKILL_CATALOG)) {
      for (const skill of categoryDef.skills) {
        const scoreValue = scores[skill.id];
        if (scoreValue !== null && scoreValue !== undefined) {
          // Validate score is 0-4
          if (scoreValue < 0 || scoreValue > 4) {
            setErrorMessage(`Invalid score ${scoreValue} for skill "${skill.name}". Scores must be 0-4.`);
            return;
          }
          scoredEntries.push({
            skillId: skill.id,
            skillName: skill.name,
            category: categoryId as SkillCategory,
            score: scoreValue,
          });
        }
      }
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      await onSave(scoredEntries);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save scores. Please try again.';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }, [scores, selectedWeek, onSave]);

  // ─── Helpers ───────────────────────────────────────────────────────────

  /** Determine change indication for a skill */
  function getChangeIndicator(skillId: string, currentScore: SkillScore | null): 'improved' | 'regressed' | null {
    if (currentScore === null || !previousScores || previousScores[skillId] === undefined) {
      return null;
    }
    const prevScore = previousScores[skillId];
    if (currentScore > prevScore) return 'improved';
    if (currentScore < prevScore) return 'regressed';
    return null;
  }

  // ─── Render ────────────────────────────────────────────────────────────

  const weekNumbers: WeekNumber[] = [1, 2, 3, 4, 5, 6, 7, 8];
  const scoreValues: SkillScore[] = [0, 1, 2, 3, 4];

  return (
    <div className="space-y-4" data-testid="skill-score-input">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Record Scores - Week {selectedWeek}
        </h3>

        {/* Copy from last week button */}
        {previousScores && Object.keys(previousScores).length > 0 && (
          <button
            type="button"
            onClick={handleCopyFromLastWeek}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            data-testid="copy-last-week-button"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy from last week
          </button>
        )}
      </div>

      {/* Week Selector */}
      <div className="flex flex-wrap items-center gap-1.5" data-testid="week-selector">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">Week:</span>
        {weekNumbers.map((week) => (
          <button
            key={week}
            type="button"
            onClick={() => handleWeekChange(week)}
            className={`h-8 w-8 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
              selectedWeek === week
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label={`Week ${week}`}
            aria-pressed={selectedWeek === week}
            data-testid={`week-button-${week}`}
          >
            {week}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div
          className="rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300"
          role="alert"
          data-testid="score-input-error"
        >
          {errorMessage}
        </div>
      )}

      {/* Category Sections */}
      <div className="space-y-3" data-testid="category-sections">
        {(Object.entries(SKILL_CATALOG) as [SkillCategory, typeof SKILL_CATALOG[SkillCategory]][]).map(
          ([categoryId, categoryDef]) => {
            const isCollapsed = collapsedCategories[categoryId] ?? false;

            return (
              <div
                key={categoryId}
                className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                data-testid={`category-section-${categoryId}`}
              >
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => handleToggleCategory(categoryId)}
                  className="flex w-full items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-left"
                  aria-expanded={!isCollapsed}
                  data-testid={`category-header-${categoryId}`}
                >
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {categoryDef.label}
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                      ({categoryDef.skills.length} skills)
                    </span>
                  </span>
                  <svg
                    className={`h-4 w-4 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Skills List */}
                {!isCollapsed && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {categoryDef.skills.map((skill) => {
                      const currentScore = scores[skill.id] ?? null;
                      const changeIndicator = getChangeIndicator(skill.id, currentScore);

                      return (
                        <div
                          key={skill.id}
                          className="flex items-center justify-between px-4 py-2 gap-2"
                          data-testid={`skill-row-${skill.id}`}
                        >
                          {/* Skill Name */}
                          <span className="text-sm text-gray-700 dark:text-gray-300 min-w-0 truncate flex-1">
                            {skill.name}
                          </span>

                          {/* Score Buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0" data-testid={`score-buttons-${skill.id}`}>
                            {scoreValues.map((scoreVal) => {
                              const isSelected = currentScore === scoreVal;
                              const bgColor = getScoreColor(scoreVal);
                              const borderClass = isSelected
                                ? changeIndicator === 'improved'
                                  ? 'ring-2 ring-green-500 ring-offset-1'
                                  : changeIndicator === 'regressed'
                                    ? 'ring-2 ring-red-500 ring-offset-1'
                                    : 'ring-2 ring-blue-500 ring-offset-1'
                                : '';

                              return (
                                <button
                                  key={scoreVal}
                                  type="button"
                                  onClick={() => handleScoreChange(skill.id, scoreVal)}
                                  className={`h-7 w-7 rounded text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${borderClass} ${
                                    isSelected ? 'shadow-sm' : 'opacity-60 hover:opacity-100'
                                  }`}
                                  style={{ backgroundColor: bgColor }}
                                  aria-label={`${skill.name}: ${SCORE_LABELS[scoreVal]} (${scoreVal})`}
                                  aria-pressed={isSelected}
                                  title={SCORE_LABELS[scoreVal]}
                                  data-testid={`score-btn-${skill.id}-${scoreVal}`}
                                >
                                  {scoreVal}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>

      {/* Footer: Save + Cancel */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          data-testid="cancel-button"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="save-button"
        >
          {saving && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {saving ? 'Saving...' : 'Save Scores'}
        </button>
      </div>
    </div>
  );
}

export default SkillScoreInput;

import React, { useState, useMemo, useEffect } from 'react';
import { SkillScoreButton } from './SkillScoreButton';
import { SKILL_CATALOG } from '../constants/skillCatalog';
import type { SkillCategory, SkillEntry, SkillScore } from '../constants/skillCatalog';
import type { RecordSkillScoresData } from '../hooks/useSkillScores';

const CATEGORY_ORDER: SkillCategory[] = ['service', 'serviceReturn', 'forehand', 'roundHead', 'backhand'];

export interface SkillScoreInputProps {
  studentId: string;
  cycleKey: string;
  weekNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  /** Skills scoreable this week, already scoped to what's assigned as a drill — never the full catalog. */
  assignedSkillsByCategory: Record<SkillCategory, readonly SkillEntry[]>;
  curriculumLoading: boolean;
  onSave: (data: RecordSkillScoresData) => Promise<void>;
  onCancel: () => void;
}

/**
 * SkillScoreInput — weekly per-skill score entry for the Skill Progression
 * Tracker's "recording" view. Mirrors SkillAssessmentForm's tab + score-row
 * layout, but only shows categories/skills the student actually has assigned
 * as drills for the given week (via SkillProgressionTracker's curriculum
 * lookup), not the tracker's full 5-category/61-skill catalog.
 */
export const SkillScoreInput: React.FC<SkillScoreInputProps> = ({
  studentId,
  cycleKey,
  weekNumber,
  assignedSkillsByCategory,
  curriculumLoading,
  onSave,
  onCancel,
}) => {
  const categoriesWithDrills = useMemo(
    () => CATEGORY_ORDER.filter((category) => assignedSkillsByCategory[category].length > 0),
    [assignedSkillsByCategory]
  );

  const [activeTab, setActiveTab] = useState<SkillCategory | null>(categoriesWithDrills[0] ?? null);
  const [scoresById, setScoresById] = useState<Record<string, SkillScore>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Land on the first category that actually has drills once the curriculum
  // finishes loading (or if the week selection changes which ones qualify).
  useEffect(() => {
    if ((activeTab === null || !categoriesWithDrills.includes(activeTab)) && categoriesWithDrills.length > 0) {
      setActiveTab(categoriesWithDrills[0]);
    }
  }, [categoriesWithDrills, activeTab]);

  const handleScoreChange = (skillId: string, score: SkillScore) => {
    setScoresById((prev) => ({ ...prev, [skillId]: score }));
    setError(null);
  };

  const handleSave = async () => {
    const touchedIds = Object.keys(scoresById);
    if (touchedIds.length === 0) {
      setError('Please score at least one skill before saving.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const scores = touchedIds.map((skillId) => {
        const category = CATEGORY_ORDER.find((cat) =>
          SKILL_CATALOG[cat].skills.some((s) => s.id === skillId)
        )!;
        const skill = SKILL_CATALOG[category].skills.find((s) => s.id === skillId)!;
        return { skillId, skillName: skill.name, category, score: scoresById[skillId] };
      });
      await onSave({ studentId, cycleKey, weekNumber, scores });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to save scores. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      data-testid="skill-score-input"
      data-student-id={studentId}
      data-cycle={cycleKey}
      data-week-number={weekNumber}
    >
      <h4 className="font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
        Recording scores for Week {weekNumber}
      </h4>

      {curriculumLoading ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading assigned drills…</p>
      ) : categoriesWithDrills.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No drills are assigned for Week {weekNumber} yet — assign some in Manage Curriculum first.
        </p>
      ) : (
        <>
          <nav className="sp-tab-nav" role="tablist" aria-label="Skill categories">
            {categoriesWithDrills.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={activeTab === category}
                aria-controls={`week-panel-${category}`}
                className={`sp-tab${activeTab === category ? ' sp-tab--active' : ''}`}
                onClick={() => setActiveTab(category)}
              >
                {SKILL_CATALOG[category].label}
              </button>
            ))}
          </nav>

          {activeTab && (
            <div
              role="tabpanel"
              id={`week-panel-${activeTab}`}
              aria-label={`${SKILL_CATALOG[activeTab].label} skills`}
              style={{ marginTop: 'var(--space-md)' }}
            >
              {assignedSkillsByCategory[activeTab].map((skill) => (
                <div key={skill.id} className="skill-assessment-skill-row">
                  <span className="skill-assessment-skill-name">{skill.name}</span>
                  <SkillScoreButton
                    value={scoresById[skill.id] ?? 0}
                    onChange={(score) => handleScoreChange(skill.id, score)}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="skill-assessment-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ padding: '8px 20px', fontSize: '13px', borderRadius: '6px' }}
            data-testid="cancel-recording-button"
          >
            Cancel
          </button>
          {error && <span className="skill-assessment-error">{error}</span>}
        </div>
        <button
          type="button"
          className="btn-create-fee"
          onClick={handleSave}
          disabled={isSaving || categoriesWithDrills.length === 0}
          data-testid="save-scores-button"
        >
          {isSaving ? 'Saving…' : 'Save Scores'}
        </button>
      </div>
    </div>
  );
};

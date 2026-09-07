import React, { useState, useMemo, useEffect } from 'react';
import { SkillScoreButton } from './SkillScoreButton';
import type { SkillScore } from '../constants/skillCatalog';
import type { RecordSkillScoresData } from '../hooks/useSkillScores';
import type { Drill } from '../types';

export interface SkillScoreInputProps {
  studentId: string;
  cycleKey: string;
  weekNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  /** Drills actually assigned this week, grouped by their own category — never a fixed skill catalog. */
  assignedDrillsByCategory: Record<string, Drill[]>;
  curriculumLoading: boolean;
  onSave: (data: RecordSkillScoresData) => Promise<void>;
  onCancel: () => void;
}

/**
 * SkillScoreInput — weekly per-drill score entry for the Skill Progression
 * Tracker's "recording" view. Mirrors SkillAssessmentForm's tab + score-row
 * layout, but scores whatever drills the student was actually assigned that
 * week (grouped by the drill's own category), not a fixed skill catalog.
 */
export const SkillScoreInput: React.FC<SkillScoreInputProps> = ({
  studentId,
  cycleKey,
  weekNumber,
  assignedDrillsByCategory,
  curriculumLoading,
  onSave,
  onCancel,
}) => {
  const categories = useMemo(
    () => Object.keys(assignedDrillsByCategory).filter((c) => assignedDrillsByCategory[c].length > 0),
    [assignedDrillsByCategory]
  );

  const [activeTab, setActiveTab] = useState<string | null>(categories[0] ?? null);
  const [scoresById, setScoresById] = useState<Record<string, SkillScore>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Land on the first category that actually has drills once the curriculum
  // finishes loading (or if the week selection changes which ones qualify).
  useEffect(() => {
    if ((activeTab === null || !categories.includes(activeTab)) && categories.length > 0) {
      setActiveTab(categories[0]);
    }
  }, [categories, activeTab]);

  // Flat lookup so handleSave can resolve a touched skillId back to its
  // drill's name/category without re-scanning every category.
  const drillById = useMemo(() => {
    const map = new Map<string, Drill>();
    for (const category of categories) {
      for (const drill of assignedDrillsByCategory[category]) {
        map.set(drill.id, drill);
      }
    }
    return map;
  }, [assignedDrillsByCategory, categories]);

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
        const drill = drillById.get(skillId)!;
        return { skillId, skillName: drill.name, category: drill.category, score: scoresById[skillId] };
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
      ) : categories.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No drills are assigned for Week {weekNumber} yet — assign some in Manage Curriculum first.
        </p>
      ) : (
        <>
          <nav className="sp-tab-nav" role="tablist" aria-label="Drill categories">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={activeTab === category}
                aria-controls={`week-panel-${category}`}
                className={`sp-tab${activeTab === category ? ' sp-tab--active' : ''}`}
                onClick={() => setActiveTab(category)}
              >
                {category}
              </button>
            ))}
          </nav>

          {activeTab && (
            <div
              role="tabpanel"
              id={`week-panel-${activeTab}`}
              aria-label={`${activeTab} drills`}
              style={{ marginTop: 'var(--space-md)' }}
            >
              {assignedDrillsByCategory[activeTab].map((drill) => (
                <div key={drill.id} className="skill-assessment-skill-row">
                  <span className="skill-assessment-skill-name">{drill.name}</span>
                  <SkillScoreButton
                    value={scoresById[drill.id] ?? 0}
                    onChange={(score) => handleScoreChange(drill.id, score)}
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
          disabled={isSaving || categories.length === 0}
          data-testid="save-scores-button"
        >
          {isSaving ? 'Saving…' : 'Save Scores'}
        </button>
      </div>
    </div>
  );
};

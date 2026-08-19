import React, { useState, useMemo } from 'react';
import './SkillAssessmentForm.css';
import { SkillScoreButton } from './SkillScoreButton';
import { SKILL_DEFINITIONS_STRUCTURED, SKILL_CATEGORIES } from '../data/skillDefinitions';
import { generateCycleKey } from '../utils/skillUtils';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';
import type { SkillCategory, SkillScore, SkillScores, SkillAssessment } from '../types';

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  forehand: 'Forehand',
  backhand: 'Backhand',
  return: 'Return',
  service: 'Service',
  overhead: 'Overhead',
  rally: 'Rally',
};

// Full column header labels matching the score button levels
const SCORE_COLUMN_LABELS = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Pro'];

export interface SkillAssessmentFormProps {
  studentId: string;
  existingAssessment?: SkillAssessment;
  onSave: (assessment: SkillAssessment) => void;
  onCancel?: () => void;
  cycleKey?: string;
}

/**
 * SkillAssessmentForm — skill assessment entry with 6 category tabs.
 * Column headers: Novice | Beginner | Intermediate | Advanced | Pro
 * Save button follows btn-create-fee design system style.
 * Saved data feeds Skill Improvement Analytics.
 */
export const SkillAssessmentForm: React.FC<SkillAssessmentFormProps> = ({
  studentId,
  existingAssessment,
  onSave,
  onCancel,
  cycleKey,
}) => {
  const { user } = useAuth();
  const currentCycleKey = useMemo(() => generateCycleKey(), []);
  const displayCycleKey = cycleKey ?? currentCycleKey;
  const isReadOnly = displayCycleKey !== currentCycleKey;

  const [activeTab, setActiveTab] = useState<SkillCategory>('forehand');
  const [scores, setScores] = useState<SkillScores>(() => {
    if (existingAssessment) return { ...existingAssessment.scores };
    const initial: SkillScores = { forehand: {}, backhand: {}, return: {}, service: {}, overhead: {}, rally: {} };
    for (const category of SKILL_CATEGORIES) {
      for (const skill of SKILL_DEFINITIONS_STRUCTURED[category]) {
        initial[category][skill.name] = 0;
      }
    }
    return initial;
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleScoreChange = (skillName: string, score: SkillScore) => {
    if (isReadOnly) return;
    setScores((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [skillName]: score },
    }));
    setError(null);
    setSuccess(null);
  };

  const hasAtLeastOneScore = (): boolean => {
    for (const category of SKILL_CATEGORIES) {
      for (const skillName of Object.keys(scores[category])) {
        if (scores[category][skillName] > 0) return true;
      }
    }
    return false;
  };

  const handleSave = async () => {
    if (isReadOnly) { setError('Cannot edit assessments from previous cycles.'); return; }
    if (!hasAtLeastOneScore()) { setError('Please score at least one skill before saving.'); return; }

    setIsSaving(true);
    setError(null);
    try {
      if (existingAssessment?.id) {
        // Update — use PATCH with just the scores
        await apiClient.patch(`/assessments/${existingAssessment.id}`, { scores });
      } else {
        // Create — API expects { studentId, cycleKey, scores }
        await apiClient.post('/assessments', {
          studentId,
          cycleKey: displayCycleKey,
          scores,
        });
      }

      setSuccess('Assessment saved successfully.');
      const assessment: SkillAssessment = {
        id: existingAssessment?.id ?? `assessment-${Date.now()}`,
        studentId,
        cycleKey: displayCycleKey,
        recordedBy: user?.name ?? 'Unknown Coach',
        recordedAt: new Date(),
        scores,
        isLocked: false,
      };
      onSave(assessment);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to save assessment. Please try again.';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="skill-assessment-form" data-testid="skill-assessment-form">
      {/* Header */}
      <div className="skill-assessment-header">
        <span className="skill-assessment-cycle" data-testid="cycle-display">
          Cycle: {displayCycleKey}
        </span>
      </div>

      {isReadOnly && (
        <div className="skill-assessment-readonly-banner" data-testid="readonly-banner">
          This assessment is from a previous cycle and cannot be edited.
        </div>
      )}

      {/* Category tabs — sp-tab style matching rest of app */}
      <nav className="sp-tab-nav" role="tablist" aria-label="Skill categories">
        {SKILL_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={activeTab === category}
            aria-controls={`panel-${category}`}
            className={`sp-tab${activeTab === category ? ' sp-tab--active' : ''}`}
            onClick={() => setActiveTab(category)}
            data-testid={`tab-${category}`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </nav>

      {/* Column headers row */}
      <div className="skill-assessment-column-headers">
        <div className="skill-assessment-col-skill-label" />
        {SCORE_COLUMN_LABELS.map((label) => (
          <div key={label} className="skill-assessment-col-header">{label}</div>
        ))}
      </div>

      {/* Skills list */}
      <div
        className="skill-assessment-skills-list"
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-label={`${CATEGORY_LABELS[activeTab]} skills`}
        data-testid={`panel-${activeTab}`}
      >
        {SKILL_DEFINITIONS_STRUCTURED[activeTab].map((skill) => (
          <div key={skill.id} className="skill-assessment-skill-row" data-testid={`skill-row-${skill.id}`}>
            <span className="skill-assessment-skill-name">{skill.name}</span>
            <SkillScoreButton
              value={(scores[activeTab][skill.name] ?? 0) as SkillScore}
              onChange={(score) => handleScoreChange(skill.name, score)}
              disabled={isReadOnly}
            />
          </div>
        ))}
      </div>

      {/* Actions — Save (primary, left) + Cancel (secondary, right) */}
      <div className="skill-assessment-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn-create-fee"
            onClick={handleSave}
            disabled={isReadOnly || isSaving}
            data-testid="save-assessment-btn"
          >
            {isSaving ? 'Saving…' : 'Save Assessment'}
          </button>
          {error && <span className="skill-assessment-error" data-testid="assessment-error">{error}</span>}
          {success && <span className="skill-assessment-success" data-testid="assessment-success">{success}</span>}
        </div>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

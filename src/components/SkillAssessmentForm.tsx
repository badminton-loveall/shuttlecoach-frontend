import React, { useState, useMemo } from 'react';
import './SkillAssessmentForm.css';
import { SkillScoreButton } from './SkillScoreButton';
import { SKILL_DEFINITIONS_STRUCTURED, SKILL_CATEGORIES } from '../data/skillDefinitions';
import { generateCycleKey } from '../utils/skillUtils';
import { useAuth } from '../contexts/AuthContext';
import type { SkillCategory, SkillScore, SkillScores, SkillAssessment } from '../types';

/**
 * Display labels for category tabs.
 */
const CATEGORY_LABELS: Record<SkillCategory, string> = {
  forehand: 'Forehand',
  backhand: 'Backhand',
  return: 'Return',
  service: 'Service',
  overhead: 'Overhead',
  rally: 'Rally',
};

export interface SkillAssessmentFormProps {
  studentId: string;
  existingAssessment?: SkillAssessment;
  onSave: (assessment: SkillAssessment) => void;
  cycleKey?: string;
}

/**
 * SkillAssessmentForm — Main skill assessment entry form with 6 category tabs.
 * Displays current bi-monthly cycle, 10 skills per category with 5-button score selectors.
 * Records coach name and timestamp on save. Locks past cycles to read-only.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */
export const SkillAssessmentForm: React.FC<SkillAssessmentFormProps> = ({
  studentId,
  existingAssessment,
  onSave,
  cycleKey,
}) => {
  const { user } = useAuth();
  const currentCycleKey = useMemo(() => generateCycleKey(), []);
  const displayCycleKey = cycleKey ?? currentCycleKey;
  const isReadOnly = displayCycleKey !== currentCycleKey;

  const [activeTab, setActiveTab] = useState<SkillCategory>('forehand');
  const [scores, setScores] = useState<SkillScores>(() => {
    if (existingAssessment) {
      return { ...existingAssessment.scores };
    }
    // Initialize all scores to 0
    const initial: SkillScores = {
      forehand: {},
      backhand: {},
      return: {},
      service: {},
      overhead: {},
      rally: {},
    };
    for (const category of SKILL_CATEGORIES) {
      for (const skill of SKILL_DEFINITIONS_STRUCTURED[category]) {
        initial[category][skill.name] = 0;
      }
    }
    return initial;
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Handle score change for a skill in the active category.
   */
  const handleScoreChange = (skillName: string, score: SkillScore) => {
    if (isReadOnly) return;
    setScores((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [skillName]: score,
      },
    }));
    setError(null);
    setSuccess(null);
  };

  /**
   * Validate that at least one skill has a non-zero score before saving.
   */
  const hasAtLeastOneScore = (): boolean => {
    for (const category of SKILL_CATEGORIES) {
      for (const skillName of Object.keys(scores[category])) {
        if (scores[category][skillName] > 0) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Handle save — records coach name and timestamp, prevents past cycle edits.
   */
  const handleSave = () => {
    if (isReadOnly) {
      setError('Cannot edit assessments from previous cycles.');
      return;
    }

    if (!hasAtLeastOneScore()) {
      setError('Please score at least one skill before saving.');
      return;
    }

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
    setError(null);
    setSuccess('Assessment saved successfully.');
  };

  return (
    <div className="skill-assessment-form" data-testid="skill-assessment-form">
      {/* Header with cycle display */}
      <div className="skill-assessment-header">
        <span className="skill-assessment-cycle" data-testid="cycle-display">
          Cycle: {displayCycleKey}
        </span>
      </div>

      {/* Read-only banner for past cycles */}
      {isReadOnly && (
        <div className="skill-assessment-readonly-banner" data-testid="readonly-banner">
          This assessment is from a previous cycle and cannot be edited.
        </div>
      )}

      {/* Category tabs */}
      <div className="skill-assessment-tabs" role="tablist" aria-label="Skill categories">
        {SKILL_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={activeTab === category}
            aria-controls={`panel-${category}`}
            className={`skill-assessment-tab ${activeTab === category ? 'skill-assessment-tab--active' : ''}`}
            onClick={() => setActiveTab(category)}
            data-testid={`tab-${category}`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {/* Skills list for active category */}
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

      {/* Actions */}
      <div className="skill-assessment-actions">
        <button
          type="button"
          className="skill-assessment-save-btn"
          onClick={handleSave}
          disabled={isReadOnly}
          data-testid="save-assessment-btn"
        >
          Save Assessment
        </button>
        {error && (
          <span className="skill-assessment-error" data-testid="assessment-error">
            {error}
          </span>
        )}
        {success && (
          <span className="skill-assessment-success" data-testid="assessment-success">
            {success}
          </span>
        )}
      </div>
    </div>
  );
};

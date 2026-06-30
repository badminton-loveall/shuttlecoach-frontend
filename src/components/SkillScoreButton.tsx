import React from 'react';
import './SkillScoreButton.css';
import type { SkillScore } from '../types';

/**
 * Short labels for the 5-button score selector.
 * 0 = ?, 1 = Beg, 2 = Int, 3 = Adv, 4 = Pro
 */
const BUTTON_LABELS: Record<SkillScore, string> = {
  0: '?',
  1: 'Beg',
  2: 'Int',
  3: 'Adv',
  4: 'Pro',
};

export interface SkillScoreButtonProps {
  value: SkillScore;
  onChange: (score: SkillScore) => void;
  disabled?: boolean;
}

/**
 * SkillScoreButton — A 5-button group selector for skill scores (0-4).
 * Displays short labels (?, Beg, Int, Adv, Pro).
 *
 * Requirements: 7.3
 */
export const SkillScoreButton: React.FC<SkillScoreButtonProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const scores: SkillScore[] = [0, 1, 2, 3, 4];

  return (
    <div className="skill-score-button-group" role="radiogroup" aria-label="Skill score selector">
      {scores.map((score) => (
        <button
          key={score}
          type="button"
          role="radio"
          aria-checked={value === score}
          aria-label={`Score ${score}: ${BUTTON_LABELS[score]}`}
          className={`skill-score-btn ${value === score ? 'skill-score-btn--active' : ''} skill-score-btn--level-${score}`}
          disabled={disabled}
          onClick={() => onChange(score)}
        >
          {BUTTON_LABELS[score]}
        </button>
      ))}
    </div>
  );
};

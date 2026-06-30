import React from 'react';
import { SKILL_DEFINITIONS_STRUCTURED, SKILL_CATEGORIES } from '../data/skillDefinitions';
import type { SkillAssessment, SkillCategory, SkillScore } from '../types';
import './WeaknessTracker.css';

/**
 * WeaknessTracker
 * Lists all skills with Skill_Score 0 or 1 (weak skills) and shows trend indicators
 * by comparing with the previous assessment cycle.
 *
 * Requirements: 8.5, 8.6
 */

export type TrendDirection = 'improving' | 'stable' | 'declining' | 'new';

export interface WeakSkill {
  skillName: string;
  category: SkillCategory;
  categoryLabel: string;
  currentScore: SkillScore;
  trend: TrendDirection;
}

interface WeaknessTrackerProps {
  currentAssessment: SkillAssessment | null;
  previousAssessment?: SkillAssessment | null;
}

const CATEGORY_DISPLAY_LABELS: Record<SkillCategory, string> = {
  forehand: 'Forehand',
  backhand: 'Backhand',
  return: 'Return',
  service: 'Service',
  overhead: 'Overhead',
  rally: 'Rally',
};

function getTrendDirection(
  currentScore: SkillScore,
  previousScore: SkillScore | undefined
): TrendDirection {
  if (previousScore === undefined) return 'new';
  if (currentScore > previousScore) return 'improving';
  if (currentScore < previousScore) return 'declining';
  return 'stable';
}

function getTrendIndicator(trend: TrendDirection): { symbol: string; className: string; label: string } {
  switch (trend) {
    case 'improving':
      return { symbol: '↑', className: 'weakness-trend--improving', label: 'Improving' };
    case 'declining':
      return { symbol: '↓', className: 'weakness-trend--declining', label: 'Declining' };
    case 'stable':
      return { symbol: '–', className: 'weakness-trend--stable', label: 'Stable' };
    case 'new':
      return { symbol: '', className: 'weakness-trend--new', label: 'New' };
  }
}

function extractWeakSkills(
  currentAssessment: SkillAssessment,
  previousAssessment?: SkillAssessment | null
): WeakSkill[] {
  const weakSkills: WeakSkill[] = [];

  for (const category of SKILL_CATEGORIES) {
    const skills = SKILL_DEFINITIONS_STRUCTURED[category];
    const currentScores = currentAssessment.scores[category];

    for (const skill of skills) {
      const currentScore = (currentScores[skill.name] ?? 0) as SkillScore;
      if (currentScore > 1) continue;

      const previousScore = previousAssessment
        ? (previousAssessment.scores[category]?.[skill.name] as SkillScore | undefined)
        : undefined;

      weakSkills.push({
        skillName: skill.name,
        category,
        categoryLabel: CATEGORY_DISPLAY_LABELS[category],
        currentScore,
        trend: getTrendDirection(currentScore, previousScore),
      });
    }
  }

  return weakSkills;
}

export const WeaknessTracker: React.FC<WeaknessTrackerProps> = ({
  currentAssessment,
  previousAssessment,
}) => {
  if (!currentAssessment) {
    return (
      <div className="weakness-tracker" data-testid="weakness-tracker">
        <h3 className="weakness-tracker__title">Weakness Tracker</h3>
        <p className="weakness-tracker__empty">No assessment data available.</p>
      </div>
    );
  }

  const weakSkills = extractWeakSkills(currentAssessment, previousAssessment);

  if (weakSkills.length === 0) {
    return (
      <div className="weakness-tracker" data-testid="weakness-tracker">
        <h3 className="weakness-tracker__title">Weakness Tracker</h3>
        <p className="weakness-tracker__empty">No weaknesses detected — great progress!</p>
      </div>
    );
  }

  return (
    <div className="weakness-tracker" data-testid="weakness-tracker">
      <h3 className="weakness-tracker__title">Weakness Tracker</h3>
      <div className="weakness-tracker__list">
        {weakSkills.map((skill) => {
          const trend = getTrendIndicator(skill.trend);
          return (
            <div
              key={`${skill.category}-${skill.skillName}`}
              className="weakness-card"
              data-testid="weakness-card"
            >
              <div className="weakness-card__info">
                <span className="weakness-card__name">{skill.skillName}</span>
                <span className="weakness-card__category">{skill.categoryLabel}</span>
              </div>
              <div className="weakness-card__metrics">
                <span className="weakness-card__score" data-testid="weakness-score">
                  {skill.currentScore}/4
                </span>
                {trend.symbol && (
                  <span
                    className={`weakness-card__trend ${trend.className}`}
                    data-testid="weakness-trend"
                    aria-label={trend.label}
                  >
                    {trend.symbol}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

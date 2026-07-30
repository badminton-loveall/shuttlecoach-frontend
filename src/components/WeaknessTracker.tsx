import React from 'react';
import { SKILL_DEFINITIONS_STRUCTURED, SKILL_CATEGORIES, SCORE_LABELS } from '../data/skillDefinitions';
import type { SkillAssessment, SkillCategory, SkillScore } from '../types';
import './WeaknessTracker.css';

/**
 * WeaknessTracker (Skill Assessment by Category)
 * Displays ALL skills grouped by category with color-coded scores and trend indicators.
 *
 * Requirements: 8.5, 8.6
 */

type TrendDirection = 'improving' | 'stable' | 'declining' | 'new';

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

function getTrend(current: number, previous: number | undefined): TrendDirection {
  if (previous === undefined) return 'new';
  if (current > previous) return 'improving';
  if (current < previous) return 'declining';
  return 'stable';
}

function getTrendSymbol(trend: TrendDirection): { symbol: string; className: string } {
  switch (trend) {
    case 'improving':
      return { symbol: '↑', className: 'trend--improving' };
    case 'declining':
      return { symbol: '↓', className: 'trend--declining' };
    case 'stable':
      return { symbol: '–', className: 'trend--stable' };
    case 'new':
      return { symbol: '', className: 'trend--new' };
  }
}

function computeAverage(scores: Record<string, number>, skillNames: string[]): number {
  if (skillNames.length === 0) return 0;
  const total = skillNames.reduce((sum, name) => sum + (scores[name] ?? 0), 0);
  return total / skillNames.length;
}

export const WeaknessTracker: React.FC<WeaknessTrackerProps> = ({
  currentAssessment,
  previousAssessment,
}) => {
  if (!currentAssessment) {
    return (
      <div className="skill-assessment" data-testid="weakness-tracker">
        <h3 className="skill-assessment__title">Skill Assessment by Category</h3>
        <p className="skill-assessment__empty">No assessment data available.</p>
      </div>
    );
  }

  return (
    <div className="skill-assessment" data-testid="weakness-tracker">
      <h3 className="skill-assessment__title">Skill Assessment by Category</h3>
      <div className="skill-assessment__grid">
        {SKILL_CATEGORIES.map((category) => {
          const skills = SKILL_DEFINITIONS_STRUCTURED[category];
          const currentScores = currentAssessment.scores[category] ?? {};
          const previousScores = previousAssessment?.scores[category];
          const skillNames = skills.map((s) => s.name);
          const avg = computeAverage(currentScores, skillNames);

          return (
            <div key={category} className="category-card" data-testid={`category-card-${category}`}>
              <div className="category-card__header">
                <span className="category-card__name">{CATEGORY_DISPLAY_LABELS[category]}</span>
                <span className="category-card__avg">Avg: {avg.toFixed(1)}/4</span>
              </div>
              <div>
                {skills.map((skill) => {
                  const score = (currentScores[skill.name] ?? 0) as SkillScore;
                  const prevScore = previousScores?.[skill.name] as number | undefined;
                  const trend = getTrend(score, prevScore);
                  const { symbol, className } = getTrendSymbol(trend);
                  const label = SCORE_LABELS[score];

                  return (
                    <div key={skill.id} className="skill-row" data-testid="skill-row">
                      <span className="skill-row__name">{skill.name}</span>
                      <div className="skill-row__right">
                        <span className="skill-row__dots">
                          {[0, 1, 2, 3, 4].map((dot) => (
                            <span
                              key={dot}
                              className={`score-dot${dot <= score && score > 0 ? ` score-dot--filled-${score}` : ''}`}
                            />
                          ))}
                        </span>
                        <span className={`skill-row__score score-color--${score}`}>
                          {score} - {label}
                        </span>
                        {previousAssessment && (
                          <span
                            className={`skill-row__trend ${className}`}
                            aria-label={trend}
                          >
                            {symbol}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { SKILL_CATEGORIES, SKILL_DEFINITIONS_STRUCTURED } from '../data/skillDefinitions';
import { calculateCategoryAverage } from '../utils/skillUtils';
import type { SkillScores, SkillCategory } from '../types';
import './SkillRadarChart.css';

/**
 * SkillRadarChart
 * Displays a 6-axis radar chart showing average skill scores by category.
 * Uses only tested skills (excludes score 0) for average calculation.
 *
 * Requirements: 8.1, 8.3, 8.4
 */

interface SkillRadarChartProps {
  scores: SkillScores | null;
}

interface RadarDataPoint {
  category: string;
  average: number;
}

const CATEGORY_DISPLAY_LABELS: Record<SkillCategory, string> = {
  forehand: 'Forehand',
  backhand: 'Backhand',
  return: 'Return',
  service: 'Service',
  overhead: 'Overhead',
  rally: 'Rally',
};

const ELECTRIC_LIME = '#B8E135';

function buildRadarData(scores: SkillScores): RadarDataPoint[] {
  return SKILL_CATEGORIES.map((category) => {
    const categorySkills = SKILL_DEFINITIONS_STRUCTURED[category];
    const categoryScores = scores[category];
    const scoreValues = categorySkills.map((skill) => categoryScores[skill.name] ?? 0);
    const average = calculateCategoryAverage(scoreValues);

    return {
      category: CATEGORY_DISPLAY_LABELS[category],
      average,
    };
  });
}

function buildEmptyRadarData(): RadarDataPoint[] {
  return SKILL_CATEGORIES.map((category) => ({
    category: CATEGORY_DISPLAY_LABELS[category],
    average: 0,
  }));
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ scores }) => {
  const data = scores ? buildRadarData(scores) : buildEmptyRadarData();

  return (
    <div className="skill-radar-chart" data-testid="skill-radar-chart">
      <h3 className="skill-radar-chart__title">Category Averages</h3>
      <div className="skill-radar-chart__container">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="var(--color-border, #374151)" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: 'var(--color-text-secondary, #9ca3af)', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 4]}
              tickCount={5}
              tick={{ fill: 'var(--color-text-secondary, #9ca3af)', fontSize: 10 }}
            />
            <Radar
              name="Average"
              dataKey="average"
              stroke={ELECTRIC_LIME}
              fill={ELECTRIC_LIME}
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

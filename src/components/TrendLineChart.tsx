import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SKILL_CATEGORIES, SKILL_DEFINITIONS_STRUCTURED } from '../data/skillDefinitions';
import { calculateCategoryAverage } from '../utils/skillUtils';
import type { SkillAssessment, SkillCategory } from '../types';
import './TrendLineChart.css';

/**
 * TrendLineChart
 * Displays a line chart showing per-skill or per-category trends across
 * multiple bi-monthly cycles.
 *
 * Requirements: 8.2, 8.3, 8.4
 */

interface TrendLineChartProps {
  assessments: SkillAssessment[];
}

type ViewMode = 'per-category' | 'per-skill';

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  forehand: '#B8E135',
  backhand: '#3B82F6',
  return: '#F59E0B',
  service: '#EC4899',
  overhead: '#8B5CF6',
  rally: '#14B8A6',
};

const CATEGORY_DISPLAY_LABELS: Record<SkillCategory, string> = {
  forehand: 'Forehand',
  backhand: 'Backhand',
  return: 'Return',
  service: 'Service',
  overhead: 'Overhead',
  rally: 'Rally',
};

/** Per-skill line colors (cycle through a palette for up to 10 skills) */
const SKILL_LINE_COLORS = [
  '#B8E135',
  '#3B82F6',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#14B8A6',
  '#EF4444',
  '#6366F1',
  '#10B981',
  '#F97316',
];

/**
 * Sort cycle keys chronologically.
 * Expected format: "Jan-Feb 2025", "Mar-Apr 2025", etc.
 */
const CYCLE_ORDER = ['Jan-Feb', 'Mar-Apr', 'May-Jun', 'Jul-Aug', 'Sep-Oct', 'Nov-Dec'];

function parseCycleKey(cycleKey: string): { label: string; year: number; index: number } {
  const parts = cycleKey.split(' ');
  const label = parts[0];
  const year = parseInt(parts[1], 10);
  const index = CYCLE_ORDER.indexOf(label);
  return { label, year, index: index >= 0 ? index : 0 };
}

function sortCycleKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const pa = parseCycleKey(a);
    const pb = parseCycleKey(b);
    if (pa.year !== pb.year) return pa.year - pb.year;
    return pa.index - pb.index;
  });
}

/**
 * Build chart data for per-category view.
 * Each data point = { cycleKey, forehand: avg, backhand: avg, ... }
 */
function buildCategoryTrendData(assessments: SkillAssessment[]) {
  const cycleKeys = sortCycleKeys([...new Set(assessments.map((a) => a.cycleKey))]);

  return cycleKeys.map((cycleKey) => {
    const assessment = assessments.find((a) => a.cycleKey === cycleKey);
    const point: Record<string, string | number> = { cycleKey };

    for (const category of SKILL_CATEGORIES) {
      if (assessment) {
        const categorySkills = SKILL_DEFINITIONS_STRUCTURED[category];
        const categoryScores = assessment.scores[category];
        const scoreValues = categorySkills.map((skill) => categoryScores[skill.name] ?? 0);
        point[category] = calculateCategoryAverage(scoreValues);
      } else {
        point[category] = 0;
      }
    }

    return point;
  });
}

/**
 * Build chart data for per-skill view within a selected category.
 * Each data point = { cycleKey, skillName1: score, skillName2: score, ... }
 */
function buildSkillTrendData(assessments: SkillAssessment[], category: SkillCategory) {
  const cycleKeys = sortCycleKeys([...new Set(assessments.map((a) => a.cycleKey))]);
  const skills = SKILL_DEFINITIONS_STRUCTURED[category];

  return cycleKeys.map((cycleKey) => {
    const assessment = assessments.find((a) => a.cycleKey === cycleKey);
    const point: Record<string, string | number> = { cycleKey };

    for (const skill of skills) {
      if (assessment) {
        point[skill.name] = assessment.scores[category][skill.name] ?? 0;
      } else {
        point[skill.name] = 0;
      }
    }

    return point;
  });
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({ assessments }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('per-category');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('forehand');

  if (assessments.length === 0) {
    return (
      <div className="trend-line-chart" data-testid="trend-line-chart">
        <h3 className="trend-line-chart__title">Skill Trends</h3>
        <p className="trend-line-chart__empty">
          No historical assessment data available yet.
        </p>
      </div>
    );
  }

  const categoryData = buildCategoryTrendData(assessments);
  const skillData = buildSkillTrendData(assessments, selectedCategory);
  const skills = SKILL_DEFINITIONS_STRUCTURED[selectedCategory];

  return (
    <div className="trend-line-chart" data-testid="trend-line-chart">
      <h3 className="trend-line-chart__title">Skill Trends</h3>

      <div className="trend-line-chart__controls">
        <div className="trend-line-chart__toggle" role="group" aria-label="View mode toggle">
          <button
            type="button"
            className={`trend-line-chart__toggle-btn ${viewMode === 'per-category' ? 'trend-line-chart__toggle-btn--active' : ''}`}
            onClick={() => setViewMode('per-category')}
            aria-pressed={viewMode === 'per-category'}
          >
            Per Category
          </button>
          <button
            type="button"
            className={`trend-line-chart__toggle-btn ${viewMode === 'per-skill' ? 'trend-line-chart__toggle-btn--active' : ''}`}
            onClick={() => setViewMode('per-skill')}
            aria-pressed={viewMode === 'per-skill'}
          >
            Per Skill
          </button>
        </div>

        {viewMode === 'per-skill' && (
          <select
            className="trend-line-chart__category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as SkillCategory)}
            aria-label="Select category"
          >
            {SKILL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_DISPLAY_LABELS[cat]}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="trend-line-chart__container">
        <ResponsiveContainer width="100%" height={300}>
          {viewMode === 'per-category' ? (
            <LineChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #374151)" />
              <XAxis
                dataKey="cycleKey"
                tick={{ fill: 'var(--color-text-secondary, #9ca3af)', fontSize: 11 }}
              />
              <YAxis
                domain={[0, 4]}
                tickCount={5}
                tick={{ fill: 'var(--color-text-secondary, #9ca3af)', fontSize: 11 }}
                label={{
                  value: 'Score',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: 'var(--color-text-secondary, #9ca3af)', fontSize: 11 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface, #1f2937)',
                  border: '1px solid var(--color-border, #374151)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--color-text-primary, #f3f4f6)' }}
              />
              <Legend />
              {SKILL_CATEGORIES.map((category) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  name={CATEGORY_DISPLAY_LABELS[category]}
                  stroke={CATEGORY_COLORS[category]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          ) : (
            <LineChart data={skillData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #374151)" />
              <XAxis
                dataKey="cycleKey"
                tick={{ fill: 'var(--color-text-secondary, #9ca3af)', fontSize: 11 }}
              />
              <YAxis
                domain={[0, 4]}
                tickCount={5}
                tick={{ fill: 'var(--color-text-secondary, #9ca3af)', fontSize: 11 }}
                label={{
                  value: 'Score',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: 'var(--color-text-secondary, #9ca3af)', fontSize: 11 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface, #1f2937)',
                  border: '1px solid var(--color-border, #374151)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--color-text-primary, #f3f4f6)' }}
              />
              <Legend />
              {skills.map((skill, idx) => (
                <Line
                  key={skill.id}
                  type="monotone"
                  dataKey={skill.name}
                  name={skill.name}
                  stroke={SKILL_LINE_COLORS[idx % SKILL_LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

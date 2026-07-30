/**
 * SkillProgressHeatmap Component
 *
 * Renders a heatmap grid of all skills across 8 weeks for a selected cycle.
 * Skills are organized in 5 collapsible category groups with color-coded score cells.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10
 */

import { useState, useCallback } from 'react';
import type { SkillScoreMatrix, SkillCategory, SkillScore } from '../constants/skillCatalog';
import { getScoreColor, getScoreLabel } from '../utils/scoreColors';

// ─── Props ───────────────────────────────────────────────────────────────────

interface SkillProgressHeatmapProps {
  matrix: SkillScoreMatrix;
  onSkillClick: (skillId: string, skillName: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SkillProgressHeatmap({ matrix, onSkillClick }: SkillProgressHeatmapProps) {
  // Track collapsed categories - initially all EXPANDED (empty set = none collapsed)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<SkillCategory>>(new Set());

  /** Toggle category collapse state */
  const handleCategoryToggle = useCallback((categoryId: SkillCategory) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  return (
    <div
      className="overflow-x-auto lg:overflow-x-visible rounded-lg"
      data-testid="skill-progress-heatmap"
    >
      <table className="w-full min-w-[800px] border-collapse text-sm">
        {/* Header row */}
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[180px]">
              Skill
            </th>
            {matrix.weeks.map((week, idx) => (
              <th
                key={week}
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[56px]"
              >
                Wk{idx + 1}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {matrix.categories.map((category) => {
            const isCollapsed = collapsedCategories.has(category.categoryId);

            return (
              <CategoryGroup
                key={category.categoryId}
                categoryId={category.categoryId}
                categoryLabel={category.categoryLabel}
                skillCount={category.skills.length}
                isCollapsed={isCollapsed}
                onToggle={handleCategoryToggle}
                weeks={matrix.weeks}
                skills={category.skills}
                cycleKey={matrix.cycleKey}
                onSkillClick={onSkillClick}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── CategoryGroup Sub-Component ─────────────────────────────────────────────

interface CategoryGroupProps {
  categoryId: SkillCategory;
  categoryLabel: string;
  skillCount: number;
  isCollapsed: boolean;
  onToggle: (categoryId: SkillCategory) => void;
  weeks: string[];
  skills: Array<{
    skillId: string;
    skillName: string;
    scores: (SkillScore | null)[];
    latestScore: SkillScore | null;
  }>;
  cycleKey?: string;
  onSkillClick: (skillId: string, skillName: string) => void;
}

function CategoryGroup({
  categoryId,
  categoryLabel,
  skillCount,
  isCollapsed,
  onToggle,
  weeks,
  skills,
  cycleKey,
  onSkillClick,
}: CategoryGroupProps) {
  return (
    <>
      {/* Category header row */}
      <tr
        className="cursor-pointer select-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => onToggle(categoryId)}
        data-testid={`category-header-${categoryId}`}
        role="button"
        aria-expanded={!isCollapsed}
        aria-label={`${categoryLabel} - ${skillCount} skills`}
      >
        <td
          className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-3 py-2 font-semibold text-gray-700 dark:text-gray-200"
          colSpan={weeks.length + 1}
        >
          <span className="inline-flex items-center gap-2">
            <ChevronIcon isCollapsed={isCollapsed} />
            {categoryLabel}
            <span className="text-xs font-normal text-gray-500">({skillCount})</span>
          </span>
        </td>
      </tr>

      {/* Skill rows (hidden when collapsed) */}
      {!isCollapsed &&
        skills.map((skill) => (
          <SkillRowComponent
            key={skill.skillId}
            skillId={skill.skillId}
            skillName={skill.skillName}
            scores={skill.scores}
            weeks={weeks}
            cycleKey={cycleKey}
            onSkillClick={onSkillClick}
          />
        ))}
    </>
  );
}

// ─── SkillRow Sub-Component ──────────────────────────────────────────────────

interface SkillRowComponentProps {
  skillId: string;
  skillName: string;
  scores: (SkillScore | null)[];
  weeks: string[];
  cycleKey?: string;
  onSkillClick: (skillId: string, skillName: string) => void;
}

function SkillRowComponent({
  skillId,
  skillName,
  scores,
  weeks: _weeks,
  cycleKey,
  onSkillClick,
}: SkillRowComponentProps) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50" data-testid={`skill-row-${skillId}`}>
      {/* Skill name cell - clickable */}
      <td
        className="sticky left-0 z-10 cursor-pointer bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 hover:underline"
        onClick={() => onSkillClick(skillId, skillName)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSkillClick(skillId, skillName);
          }
        }}
        aria-label={`View timeline for ${skillName}`}
      >
        {skillName}
      </td>

      {/* Score cells */}
      {scores.map((score, weekIdx) => (
        <ScoreCell
          key={`${skillId}-wk${weekIdx + 1}`}
          score={score}
          weekNumber={weekIdx + 1}
          cycleKey={cycleKey}
          skillId={skillId}
          skillName={skillName}
          onSkillClick={onSkillClick}
        />
      ))}
    </tr>
  );
}

// ─── ScoreCell Sub-Component ─────────────────────────────────────────────────

interface ScoreCellProps {
  score: SkillScore | null;
  weekNumber: number;
  cycleKey?: string;
  skillId: string;
  skillName: string;
  onSkillClick: (skillId: string, skillName: string) => void;
}

function ScoreCell({ score, weekNumber, cycleKey, skillId, skillName, onSkillClick }: ScoreCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (score === null) {
    return (
      <td className="px-1 py-1.5 text-center">
        <span className="inline-block h-7 w-7 leading-7 text-xs text-gray-400 dark:text-gray-500">-</span>
      </td>
    );
  }

  const bgColor = getScoreColor(score);
  const label = getScoreLabel(score);
  const tooltipText = `Week ${weekNumber}, ${cycleKey ?? 'N/A'}: ${score} - ${label}`;
  const isPro = score === 4;

  return (
    <td className="relative px-1 py-1.5 text-center">
      <button
        type="button"
        className="relative inline-flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
        style={{ backgroundColor: bgColor, color: isPro ? '#FFFFFF' : '#1F2937' }}
        onClick={() => onSkillClick(skillId, skillName)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label={tooltipText}
        data-testid={`score-cell-${skillId}-wk${weekNumber}`}
      >
        {isPro ? (
          <CheckIcon />
        ) : (
          score
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 dark:bg-gray-700 px-2 py-1 text-xs text-white shadow-lg"
          role="tooltip"
          data-testid={`tooltip-${skillId}-wk${weekNumber}`}
        >
          {tooltipText}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-700" />
        </div>
      )}
    </td>
  );
}

// ─── Icon Components ─────────────────────────────────────────────────────────

function ChevronIcon({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

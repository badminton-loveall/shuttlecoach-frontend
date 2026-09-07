/**
 * SkillProgressHeatmap Component
 *
 * Renders a heatmap grid of all skills across weeks for a selected cycle.
 * Skills are organized in collapsible category groups with color-coded score cells.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10
 */

import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
import type { SkillScoreMatrix, SkillScore } from '../constants/skillCatalog';
import { getScoreColor, getScoreLabel } from '../utils/scoreColors';

/** Keeps the skill-name column visible while scrolling a wide row of weeks. */
const STICKY_COLUMN_STYLE: CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 1,
  backgroundColor: 'var(--surface-card)',
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface SkillProgressHeatmapProps {
  matrix: SkillScoreMatrix;
  onSkillClick: (skillId: string, skillName: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SkillProgressHeatmap({ matrix, onSkillClick }: SkillProgressHeatmapProps) {
  // Track collapsed categories - initially all EXPANDED (empty set = none collapsed)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  /** Toggle category collapse state */
  const handleCategoryToggle = useCallback((categoryId: string) => {
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
    <div className="table-container overflow-x-auto" data-testid="skill-progress-heatmap">
      <table className="table-base" style={{ minWidth: 480 }}>
        {/* Header row */}
        <thead>
          <tr className="table-header">
            <th className="table-cell-header" style={{ minWidth: 180, ...STICKY_COLUMN_STYLE, backgroundColor: 'var(--surface-hover)' }}>
              Skill
            </th>
            {matrix.weeks.map((week, idx) => (
              <th key={week} className="table-cell-header table-cell-center" style={{ minWidth: 56 }}>
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
  categoryId: string;
  categoryLabel: string;
  skillCount: number;
  isCollapsed: boolean;
  onToggle: (categoryId: string) => void;
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
        className="table-row"
        style={{ cursor: 'pointer', backgroundColor: 'var(--surface-hover)' }}
        onClick={() => onToggle(categoryId)}
        data-testid={`category-header-${categoryId}`}
        role="button"
        aria-expanded={!isCollapsed}
        aria-label={`${categoryLabel} - ${skillCount} skills`}
      >
        <td
          className="table-cell"
          colSpan={weeks.length + 1}
          style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}
        >
          <span className="inline-flex items-center gap-2">
            <ChevronIcon isCollapsed={isCollapsed} />
            {categoryLabel}
            <span className="text-xs" style={{ fontWeight: 'var(--weight-regular)', color: 'var(--text-tertiary)' }}>
              ({skillCount})
            </span>
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
    <tr className="table-row" data-testid={`skill-row-${skillId}`}>
      {/* Skill name cell - clickable */}
      <td
        className="table-cell"
        style={{ cursor: 'pointer', ...STICKY_COLUMN_STYLE }}
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
      <td className="table-cell table-cell-center">
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>-</span>
      </td>
    );
  }

  const bgColor = getScoreColor(score);
  const label = getScoreLabel(score);
  const tooltipText = `Week ${weekNumber}, ${cycleKey ?? 'N/A'}: ${score} - ${label}`;
  const isPro = score === 4;

  return (
    <td className="table-cell table-cell-center" style={{ position: 'relative' }}>
      <button
        type="button"
        className="transition-transform hover:scale-110 focus:outline-none"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          fontSize: 'var(--font-xs)',
          fontWeight: 'var(--weight-semibold)',
          backgroundColor: bgColor,
          color: isPro ? '#FFFFFF' : '#1F2937',
          cursor: 'pointer',
        }}
        onClick={() => onSkillClick(skillId, skillName)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label={tooltipText}
        data-testid={`score-cell-${skillId}-wk${weekNumber}`}
      >
        {isPro ? <CheckIcon /> : score}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          data-testid={`tooltip-${skillId}-wk${weekNumber}`}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            zIndex: 20,
            whiteSpace: 'nowrap',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--text-primary)',
            color: 'var(--surface-card)',
            padding: '4px 8px',
            fontSize: 'var(--font-xs)',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          {tooltipText}
        </div>
      )}
    </td>
  );
}

// ─── Icon Components ─────────────────────────────────────────────────────────

function ChevronIcon({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      style={{ color: 'var(--text-tertiary)', transition: 'transform var(--transition-fast)', transform: isCollapsed ? 'none' : 'rotate(90deg)' }}
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
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

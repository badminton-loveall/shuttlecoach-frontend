/**
 * SkillTimeline Component
 *
 * Renders a CSS/SVG-based timeline chart showing a single skill's
 * score progression across all cycles. Uses inline SVG for connecting
 * lines between data points and Tailwind for layout.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 */

import { useState, useMemo } from 'react';
import { useSkillTimeline } from '../hooks/useSkillTimeline';
import type { SkillTimelinePoint } from '../hooks/useSkillTimeline';
import { getScoreColor, getScoreLabel } from '../utils/scoreColors';
import type { SkillScore } from '../constants/skillCatalog';

// ─── Props ───────────────────────────────────────────────────────────────────

interface SkillTimelineProps {
  studentId: string;
  skillId: string;
  skillName: string;
  onBack: () => void;
}

// ─── Y-axis labels (score 0-4) ──────────────────────────────────────────────

const Y_LABELS: { score: SkillScore; label: string }[] = [
  { score: 4, label: '4 - Pro' },
  { score: 3, label: '3 - Advanced' },
  { score: 2, label: '2 - Intermediate' },
  { score: 1, label: '1 - Beginner' },
  { score: 0, label: "0 - Don't Know" },
];

// ─── Constants ───────────────────────────────────────────────────────────────

const CHART_HEIGHT = 200; // px height of chart area
const DOT_RADIUS = 6;

// ─── Component ───────────────────────────────────────────────────────────────

export function SkillTimeline({ studentId, skillId, skillName, onBack }: SkillTimelineProps) {
  const { timeline, currentScore, loading, error } = useSkillTimeline({ studentId, skillId });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group timeline points by cycle for boundary markers
  const { points, cycleBoundaries, xLabels } = useMemo(() => {
    if (timeline.length === 0) {
      return { points: [], cycleBoundaries: [] as number[], xLabels: [] as string[] };
    }

    // Timeline is already ordered chronologically from the hook
    const pts = timeline.map((point, idx) => ({
      ...point,
      index: idx,
    }));

    // Determine cycle boundaries (index where cycle changes)
    const boundaries: number[] = [];
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].cycleKey !== pts[i - 1].cycleKey) {
        boundaries.push(i);
      }
    }

    // Build X-axis labels
    const labels = pts.map((pt) => `Wk${pt.weekNumber}`);

    return { points: pts, cycleBoundaries: boundaries, xLabels: labels };
  }, [timeline]);

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4" data-testid="skill-timeline-loading">
        <TimelineHeader skillName={skillName} currentScore={null} onBack={onBack} />
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-green-600" />
          <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Loading timeline...</span>
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="space-y-4" data-testid="skill-timeline-error">
        <TimelineHeader skillName={skillName} currentScore={null} onBack={onBack} />
        <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // ─── Empty State ───────────────────────────────────────────────────────────

  if (points.length === 0) {
    return (
      <div className="space-y-4" data-testid="skill-timeline-empty">
        <TimelineHeader skillName={skillName} currentScore={null} onBack={onBack} />
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No score history available for this skill.</p>
        </div>
      </div>
    );
  }

  // ─── Chart Calculations ────────────────────────────────────────────────────

  const totalPoints = points.length;
  const chartWidth = Math.max(totalPoints * 60, 300); // Minimum 60px per point
  const yStep = CHART_HEIGHT / 4; // 5 levels (0-4), 4 intervals

  // Calculate positions for each data point
  const pointPositions = points.map((pt, idx) => {
    const x = totalPoints === 1 ? chartWidth / 2 : (idx / (totalPoints - 1)) * (chartWidth - 40) + 20;
    const y = CHART_HEIGHT - (pt.score / 4) * CHART_HEIGHT;
    return { x, y, point: pt };
  });

  // Build SVG path for connecting lines
  const linePath = pointPositions
    .map((pos, idx) => `${idx === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`)
    .join(' ');

  // Cycle boundary X positions
  const boundaryXPositions = cycleBoundaries.map((boundaryIdx) => {
    // Position halfway between the last point of previous cycle and first of new cycle
    if (boundaryIdx > 0 && boundaryIdx < pointPositions.length) {
      return (pointPositions[boundaryIdx - 1].x + pointPositions[boundaryIdx].x) / 2;
    }
    return 0;
  });

  return (
    <div className="space-y-4" data-testid="skill-timeline">
      <TimelineHeader skillName={skillName} currentScore={currentScore} onBack={onBack} />

      {/* Chart Container */}
      <div className="relative overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex">
          {/* Y-axis labels */}
          <div
            className="flex flex-col justify-between pr-3 text-xs text-gray-500 dark:text-gray-400"
            style={{ height: `${CHART_HEIGHT}px` }}
            aria-hidden="true"
          >
            {Y_LABELS.map(({ score, label }) => (
              <span key={score} className="whitespace-nowrap leading-none">
                {label}
              </span>
            ))}
          </div>

          {/* Chart Area */}
          <div className="relative flex-1" style={{ minWidth: `${chartWidth}px` }}>
            {/* Grid lines */}
            <svg
              width="100%"
              height={CHART_HEIGHT}
              className="absolute inset-0"
              aria-hidden="true"
            >
              {/* Horizontal grid lines for each score level */}
              {[0, 1, 2, 3, 4].map((score) => {
                const y = CHART_HEIGHT - (score / 4) * CHART_HEIGHT;
                return (
                  <line
                    key={score}
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth={1}
                    strokeDasharray={score === 0 || score === 4 ? undefined : '4,4'}
                  />
                );
              })}

              {/* Cycle boundary vertical lines */}
              {boundaryXPositions.map((bx, idx) => (
                <line
                  key={`boundary-${idx}`}
                  x1={bx}
                  y1={0}
                  x2={bx}
                  y2={CHART_HEIGHT}
                  stroke="#9CA3AF"
                  strokeWidth={1}
                  strokeDasharray="6,4"
                  data-testid={`cycle-boundary-${idx}`}
                />
              ))}
            </svg>

            {/* Data line and dots */}
            <svg
              width={chartWidth}
              height={CHART_HEIGHT}
              className="relative"
              role="img"
              aria-label={`Timeline chart for ${skillName} showing score progression`}
            >
              {/* Connecting line */}
              <path
                d={linePath}
                fill="none"
                stroke="#16A34A"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {pointPositions.map((pos, idx) => (
                <g key={idx}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={DOT_RADIUS}
                    fill={getScoreColor(pos.point.score)}
                    stroke="#374151"
                    strokeWidth={1.5}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    data-testid={`timeline-dot-${idx}`}
                  />
                </g>
              ))}
            </svg>

            {/* Tooltip */}
            {hoveredIndex !== null && (
              <TimelineTooltip
                point={points[hoveredIndex]}
                x={pointPositions[hoveredIndex].x}
                y={pointPositions[hoveredIndex].y}
                chartWidth={chartWidth}
              />
            )}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex pl-16" style={{ minWidth: `${chartWidth}px` }}>
          <div className="relative w-full" style={{ height: '40px' }}>
            {pointPositions.map((pos, idx) => (
              <span
                key={idx}
                className="absolute text-xs text-gray-500 dark:text-gray-400"
                style={{
                  left: `${pos.x}px`,
                  top: '8px',
                  transform: 'translateX(-50%)',
                }}
              >
                {xLabels[idx]}
              </span>
            ))}

            {/* Cycle labels below week numbers */}
            {renderCycleLabels(points, pointPositions)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Header with back button, skill name, and current score badge */
function TimelineHeader({
  skillName,
  currentScore,
  onBack,
}: {
  skillName: string;
  currentScore: SkillScore | null;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
          data-testid="timeline-back-button"
          aria-label="Back to heatmap"
        >
          <span aria-hidden="true">&larr;</span> Back
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{skillName}</h3>
      </div>

      {currentScore !== null && (
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
          style={{
            backgroundColor: getScoreColor(currentScore),
            color: currentScore >= 4 ? '#FFFFFF' : '#1F2937',
          }}
          data-testid="current-score-badge"
        >
          Current: {currentScore} - {getScoreLabel(currentScore)}
        </span>
      )}
    </div>
  );
}

/** Tooltip displayed on hover over a data point */
function TimelineTooltip({
  point,
  x,
  y,
  chartWidth,
}: {
  point: SkillTimelinePoint;
  x: number;
  y: number;
  chartWidth: number;
}) {
  // Position tooltip to the right of the dot, or left if near the right edge
  const tooltipOnLeft = x > chartWidth * 0.7;
  const formattedDate = point.recordedAt instanceof Date
    ? point.recordedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div
      className="absolute z-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-lg"
      style={{
        left: tooltipOnLeft ? `${x - 160}px` : `${x + 12}px`,
        top: `${y - 10}px`,
      }}
      data-testid="timeline-tooltip"
      role="tooltip"
    >
      <div className="space-y-1">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {point.cycleKey} - Week {point.weekNumber}
        </p>
        <p className="text-gray-600 dark:text-gray-400">Date: {formattedDate}</p>
        <p className="text-gray-600 dark:text-gray-400">
          Score:{' '}
          <span className="font-medium" style={{ color: getScoreColor(point.score) === '#FEE2E2' ? '#B91C1C' : '#16A34A' }}>
            {point.score} - {getScoreLabel(point.score)}
          </span>
        </p>
      </div>
    </div>
  );
}

/** Render cycle labels along the X-axis below week labels */
function renderCycleLabels(
  points: (SkillTimelinePoint & { index: number })[],
  pointPositions: { x: number; y: number; point: SkillTimelinePoint }[]
) {
  if (points.length === 0) return null;

  // Group consecutive points by cycle to determine label position
  const cycleGroups: { cycleKey: string; startX: number; endX: number }[] = [];
  let currentCycle = points[0].cycleKey;
  let startX = pointPositions[0].x;

  for (let i = 1; i <= points.length; i++) {
    if (i === points.length || points[i].cycleKey !== currentCycle) {
      cycleGroups.push({
        cycleKey: currentCycle,
        startX,
        endX: pointPositions[i - 1].x,
      });
      if (i < points.length) {
        currentCycle = points[i].cycleKey;
        startX = pointPositions[i].x;
      }
    }
  }

  return cycleGroups.map((group, idx) => {
    const centerX = (group.startX + group.endX) / 2;
    return (
      <span
        key={`cycle-label-${idx}`}
        className="absolute text-xs font-medium text-gray-700 dark:text-gray-300"
        style={{
          left: `${centerX}px`,
          top: '24px',
          transform: 'translateX(-50%)',
        }}
      >
        {group.cycleKey}
      </span>
    );
  });
}

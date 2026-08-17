import React, { useState, useCallback, useRef, useEffect } from 'react';
import './TrainingTab.css';

/**
 * DrillSkillsMatrix Component
 *
 * Renders a grid of curriculum drills × skill score columns (0–4).
 * Coaches can tap cells to set scores (optimistic UI with revert on failure).
 * Students see a read-only view.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DrillSkillsMatrixProps {
  drills: Array<{ name: string; focusArea: string }>;
  scores: Record<string, number>; // drillName → score (0–4)
  onScoreChange: (drillName: string, score: number) => Promise<void>;
  readOnly?: boolean; // true for Student_User role
  onDrillSelect?: (drillName: string) => void; // opens training history
  selectedDrill?: string | null;
  loading?: boolean;
}

type SavingState = 'saving' | 'saved' | 'error';

interface FocusedCell {
  row: number; // drill index
  col: number; // score column 0–4
}

const SCORE_LABELS = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Pro'];
const NUM_SCORE_COLS = 5; // columns 0–4

// ─── Component ───────────────────────────────────────────────────────────────

export const DrillSkillsMatrix: React.FC<DrillSkillsMatrixProps> = ({
  drills,
  scores,
  onScoreChange,
  readOnly = false,
  onDrillSelect,
  selectedDrill,
  loading = false,
}) => {
  // Optimistic scores: local override while saving
  const [optimisticScores, setOptimisticScores] = useState<Record<string, number>>({});
  // Saving state per drill row
  const [savingState, setSavingState] = useState<Record<string, SavingState>>({});
  // Ref for saved timers so we can clear them
  const savedTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Keyboard navigation: tracked focused cell
  const [focusedCell, setFocusedCell] = useState<FocusedCell | null>(null);
  // Ref to the grid container for querying score cells
  const gridRef = useRef<HTMLDivElement>(null);

  /**
   * Get the displayed score for a drill (optimistic if present, otherwise prop).
   */
  const getDisplayedScore = useCallback(
    (drillName: string): number | undefined => {
      if (drillName in optimisticScores) {
        return optimisticScores[drillName];
      }
      return scores[drillName];
    },
    [optimisticScores, scores]
  );

  /**
   * Handle score cell tap (coach only).
   * Implements optimistic UI: immediately highlight, call API, revert on failure.
   */
  const handleScoreTap = useCallback(
    async (drillName: string, score: number) => {
      if (readOnly) return;

      const previousScore = scores[drillName];

      // 1. Optimistic update
      setOptimisticScores((prev) => ({ ...prev, [drillName]: score }));

      // 2. Set saving state
      setSavingState((prev) => ({ ...prev, [drillName]: 'saving' }));

      // Clear any existing saved timer for this drill
      if (savedTimers.current[drillName]) {
        clearTimeout(savedTimers.current[drillName]);
      }

      try {
        // 3. Call API
        await onScoreChange(drillName, score);

        // 4. Success: clear optimistic (prop will reflect new value), set saved
        setOptimisticScores((prev) => {
          const next = { ...prev };
          delete next[drillName];
          return next;
        });
        setSavingState((prev) => ({ ...prev, [drillName]: 'saved' }));

        // Clear saved indicator after 2s
        savedTimers.current[drillName] = setTimeout(() => {
          setSavingState((prev) => {
            const next = { ...prev };
            delete next[drillName];
            return next;
          });
        }, 2000);
      } catch {
        // 5. Failure: revert optimistic score, show error
        setOptimisticScores((prev) => {
          const next = { ...prev };
          if (previousScore !== undefined) {
            next[drillName] = previousScore;
          } else {
            delete next[drillName];
          }
          return next;
        });
        setSavingState((prev) => ({ ...prev, [drillName]: 'error' }));
      }
    },
    [readOnly, scores, onScoreChange]
  );

  /**
   * Handle drill name click (expand training history).
   */
  const handleDrillClick = useCallback(
    (drillName: string) => {
      onDrillSelect?.(drillName);
    },
    [onDrillSelect]
  );

  /**
   * Focus the DOM cell matching the current focusedCell state.
   */
  useEffect(() => {
    if (!focusedCell || !gridRef.current) return;
    const drill = drills[focusedCell.row];
    if (!drill) return;
    const selector = `[data-testid="score-cell-${drill.name}-${focusedCell.col}"]`;
    const cell = gridRef.current.querySelector<HTMLElement>(selector);
    cell?.focus();
  }, [focusedCell, drills]);

  /**
   * Handle keyboard navigation within the grid.
   * Arrow keys move focus; Enter/Space triggers score tap for coach; Escape collapses history.
   */
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const maxRow = drills.length - 1;
      if (maxRow < 0) return;

      // If no focused cell yet, initialize on first arrow key press
      if (!focusedCell) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          setFocusedCell({ row: 0, col: 0 });
        }
        return;
      }

      const { row, col } = focusedCell;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocusedCell({ row, col: Math.min(col + 1, NUM_SCORE_COLS - 1) });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedCell({ row, col: Math.max(col - 1, 0) });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedCell({ row: Math.min(row + 1, maxRow), col });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedCell({ row: Math.max(row - 1, 0), col });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!readOnly) {
            const drill = drills[row];
            if (drill) {
              void handleScoreTap(drill.name, col);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (selectedDrill) {
            onDrillSelect?.(selectedDrill); // toggle off
          }
          setFocusedCell(null);
          break;
        default:
          break;
      }
    },
    [focusedCell, drills, readOnly, handleScoreTap, selectedDrill, onDrillSelect]
  );

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="training-skeleton" data-testid="drill-skills-matrix-loading">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="training-skeleton__row" />
        ))}
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label="Drill Skills Matrix"
      className="drill-skills-matrix"
      data-testid="drill-skills-matrix"
      onKeyDown={handleGridKeyDown}
    >
      {/* Header row */}
      <div role="row" className="drill-skills-matrix__header">
        <div role="columnheader" className="drill-skills-matrix__header-cell">
          Drill
        </div>
        {SCORE_LABELS.map((label, i) => (
          <div key={i} role="columnheader" className="drill-skills-matrix__header-cell">
            {label}
          </div>
        ))}
        <div role="columnheader" className="drill-skills-matrix__header-cell">
          Status
        </div>
      </div>

      {/* Drill rows */}
      {drills.map((drill, rowIndex) => {
        const currentScore = getDisplayedScore(drill.name);
        const rowSavingState = savingState[drill.name];
        const isSelected = selectedDrill === drill.name;

        return (
          <div
            key={drill.name}
            role="row"
            aria-label={drill.name}
            className="drill-skills-matrix__row"
          >
            {/* Drill name cell */}
            <div
              role="rowheader"
              className="drill-skills-matrix__drill-name"
              onClick={() => handleDrillClick(drill.name)}
              data-testid={`drill-name-${drill.name}`}
              aria-expanded={isSelected}
            >
              {drill.name}
            </div>

            {/* Score cells (0–4) */}
            {SCORE_LABELS.map((label, scoreValue) => {
              const isActive = currentScore === scoreValue;
              const isFocused =
                focusedCell !== null &&
                focusedCell.row === rowIndex &&
                focusedCell.col === scoreValue;
              const cellClasses = [
                'score-cell',
                isActive ? 'score-cell--active' : '',
                rowSavingState === 'saving' && isActive ? 'score-cell--saving' : '',
                rowSavingState === 'error' && isActive ? 'score-cell--error' : '',
                readOnly ? 'score-cell--readonly' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={scoreValue}
                  role="gridcell"
                  aria-label={`${drill.name}, ${label}`}
                  aria-selected={isActive}
                  className={cellClasses}
                  onClick={
                    readOnly ? undefined : () => void handleScoreTap(drill.name, scoreValue)
                  }
                  onFocus={() => setFocusedCell({ row: rowIndex, col: scoreValue })}
                  data-testid={`score-cell-${drill.name}-${scoreValue}`}
                  tabIndex={isFocused ? 0 : -1}
                >
                  <span className="score-cell__indicator">
                    {isActive && <span className="score-cell__radio-dot" />}
                  </span>
                </div>
              );
            })}

            {/* Status column */}
            <div
              className={`drill-skills-matrix__status ${
                rowSavingState ? `drill-skills-matrix__status--${rowSavingState}` : ''
              }`}
              data-testid={`drill-status-${drill.name}`}
            >
              {rowSavingState === 'saving' && '⏳'}
              {rowSavingState === 'saved' && '✓'}
              {rowSavingState === 'error' && '⚠'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DrillSkillsMatrix;

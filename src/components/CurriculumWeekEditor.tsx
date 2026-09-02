import React, { useState } from 'react';
import type { Drill } from '../types';
import { useDrills } from '../hooks/useDrills';
import { DRILL_CATEGORIES } from '../constants/drillCategories';
import './CurriculumWeekEditor.css';

/**
 * CurriculumWeekEditor
 *
 * Shared week-by-week curriculum editor: week tabs, focus area/objective fields, and a
 * click-based two-panel drill transfer list (search + category filter on the left,
 * this week's assigned drills on the right — click either side to move a drill).
 *
 * Extracted from the batch wizard's CurriculumStep (which is not reusable outside the
 * wizard because it's wired to WizardContext) so the same, more usable click-to-add/remove
 * pattern can be reused anywhere a week's drills need editing — the standalone Curriculum
 * page and a student's individual curriculum page.
 */

export interface EditableWeek {
  weekNumber: number;
  focusArea: string;
  objective: string;
  drills: Drill[];
}

interface CurriculumWeekEditorProps {
  weeks: EditableWeek[];
  activeWeekNum: number;
  onActiveWeekChange: (weekNumber: number) => void;
  onWeekFieldChange: (weekNumber: number, field: 'focusArea' | 'objective', value: string) => void;
  onAddWeek: () => void;
  onRemoveWeek: (weekNumber: number) => void;
  onAddDrill: (weekNumber: number, drill: Drill) => void;
  onRemoveDrill: (weekNumber: number, drillId: string) => void;
  disabled?: boolean;
  maxWeeks?: number;
}

export const CurriculumWeekEditor: React.FC<CurriculumWeekEditorProps> = ({
  weeks,
  activeWeekNum,
  onActiveWeekChange,
  onWeekFieldChange,
  onAddWeek,
  onRemoveWeek,
  onAddDrill,
  onRemoveDrill,
  disabled = false,
  maxWeeks = 52,
}) => {
  const { drills: allDrills } = useDrills({ annotatePackStatus: true });
  const [drillSearch, setDrillSearch] = useState('');
  const [drillCategory, setDrillCategory] = useState('All');

  const activeWeek = weeks.find((w) => w.weekNumber === activeWeekNum) ?? weeks[0];
  const assignedDrillIds = new Set(activeWeek?.drills.map((d) => d.id) ?? []);

  const availableDrills = allDrills.filter((d) => {
    if (assignedDrillIds.has(d.id)) return false;
    const matchSearch = d.name.toLowerCase().includes(drillSearch.toLowerCase());
    const matchCat = drillCategory === 'All' || d.category === drillCategory;
    return matchSearch && matchCat;
  });

  const groupedAvailable: { category: string; drills: Drill[] }[] = [];
  availableDrills.forEach((drill) => {
    const last = groupedAvailable[groupedAvailable.length - 1];
    if (last && last.category === drill.category) {
      last.drills.push(drill);
    } else {
      groupedAvailable.push({ category: drill.category, drills: [drill] });
    }
  });

  return (
    <div className="curriculum-step__editor-wrapper">
      {/* Week tabs */}
      <div className="curriculum-week-tabs" style={{ borderBottom: '1px solid var(--border-default)', padding: '0 var(--space-sm)' }}>
        {weeks.map((week) => (
          <button
            key={week.weekNumber}
            type="button"
            onClick={() => onActiveWeekChange(week.weekNumber)}
            className={`curriculum-week-tab${activeWeekNum === week.weekNumber ? ' curriculum-week-tab--active' : ''}`}
          >
            W{week.weekNumber}
            {!disabled && weeks.length > 1 && activeWeekNum === week.weekNumber && (
              <span
                onClick={(e) => { e.stopPropagation(); onRemoveWeek(week.weekNumber); }}
                style={{ marginLeft: '6px', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '0.75rem' }}
                role="button" aria-label={`Remove Week ${week.weekNumber}`}
              >✕</span>
            )}
          </button>
        ))}
        {!disabled && weeks.length < maxWeeks && (
          <button type="button" onClick={onAddWeek} className="curriculum-week-tab" aria-label="Add Week">+</button>
        )}
      </div>

      {/* Focus area + objective */}
      {activeWeek && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <input
            type="text"
            value={activeWeek.focusArea}
            onChange={(e) => onWeekFieldChange(activeWeek.weekNumber, 'focusArea', e.target.value)}
            placeholder="Focus area, e.g. Foundation — Grip and Basic Footwork"
            className="input"
            disabled={disabled}
          />
          <textarea
            value={activeWeek.objective}
            onChange={(e) => onWeekFieldChange(activeWeek.weekNumber, 'objective', e.target.value)}
            placeholder="Weekly objective, e.g. Establish proper grip habits and develop basic court coverage"
            rows={2}
            className="input"
            style={{ height: 'auto', resize: 'vertical' }}
            disabled={disabled}
          />
        </div>
      )}

      {/* Drill transfer: two equal-height boxes + arrow column */}
      <div className="curriculum-step__drill-transfer">
        {/* Left: Available */}
        <div className="curriculum-step__drill-box">
          <div className="curriculum-step__drill-box-header">
            <span className="text-label">Available Drills</span>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <input
                type="text"
                value={drillSearch}
                onChange={(e) => setDrillSearch(e.target.value)}
                placeholder="Search…"
                className="input"
                style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
              />
              <select
                value={drillCategory}
                onChange={(e) => setDrillCategory(e.target.value)}
                className="input"
                style={{ padding: '6px 8px', fontSize: '12px', width: 'auto' }}
              >
                <option value="All">All</option>
                {DRILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="curriculum-step__drill-list">
            {availableDrills.length === 0 ? (
              <p className="curriculum-step__drill-empty">No drills available</p>
            ) : (
              groupedAvailable.map((group) => (
                <React.Fragment key={group.category}>
                  <div className="curriculum-step__drill-category-label">{group.category}</div>
                  {group.drills.map((drill) => {
                    const unavailable = drill.isAssignable === false;
                    const canAdd = !disabled && !unavailable;
                    return (
                      <div
                        key={drill.id}
                        className={`curriculum-step__drill-item ${unavailable ? 'curriculum-step__drill-item--unavailable' : 'curriculum-step__drill-item--clickable'}`}
                        onClick={() => canAdd && onAddDrill(activeWeekNum, drill)}
                        role="option"
                        aria-selected={false}
                        aria-disabled={unavailable}
                        tabIndex={0}
                        title={unavailable ? "This drill's pack is currently disabled" : disabled ? undefined : 'Click to add to week'}
                        onKeyDown={(e) => { if (canAdd && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onAddDrill(activeWeekNum, drill); } }}
                      >
                        <span>{drill.name}</span>
                        {unavailable ? (
                          <span className="curriculum-step__drill-used-badge">Used</span>
                        ) : (
                          <span className="curriculum-step__drill-add-hint">→</span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        {/* Middle: arrow column (visual balance) */}
        <div className="curriculum-step__drill-arrows" style={{ paddingTop: '56px' }}>
          <span style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>→</span>
          <span style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>←</span>
        </div>

        {/* Right: Assigned */}
        <div className="curriculum-step__drill-box">
          <div className="curriculum-step__drill-box-header">
            <span className="text-label">Week {activeWeekNum} Drills</span>
          </div>
          <div className="curriculum-step__drill-list">
            {(activeWeek?.drills ?? []).length === 0 ? (
              <p className="curriculum-step__drill-empty">Click a drill to add it here</p>
            ) : (
              (activeWeek?.drills ?? []).map((drill) => (
                <div
                  key={drill.id}
                  className="curriculum-step__drill-item curriculum-step__drill-item--assigned curriculum-step__drill-item--clickable"
                  onClick={() => !disabled && onRemoveDrill(activeWeekNum, drill.id)}
                  role="option"
                  aria-selected={false}
                  tabIndex={0}
                  title={disabled ? undefined : 'Click to remove from week'}
                  onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onRemoveDrill(activeWeekNum, drill.id); } }}
                >
                  <span>{drill.name}</span>
                  <span className="curriculum-step__drill-remove-hint">✕</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumWeekEditor;

import React, { useState, useCallback, useEffect } from 'react';
import { useWizard } from './WizardContext';
import { useCourses } from '../../hooks/useCourses';
import type { Course, CourseWeek } from '../../hooks/useCourses';
import type { Drill } from '../../types';
import { useDrills } from '../../hooks/useDrills';
import { DRILL_CATEGORIES } from '../../constants/drillCategories';
import './CurriculumStep.css';

const MAX_WEEKS = 52;

const createEmptyWeek = (weekNumber: number): CourseWeek => ({
  weekNumber, focusArea: '', objective: '', drills: [],
});

export const CurriculumStep: React.FC = () => {
  const { state, updateCurriculum } = useWizard();
  const { courses, loading, error, createCourse, updateCourse, getCourseById, refetch } = useCourses();
  const { drills: allDrills } = useDrills({ annotatePackStatus: true });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseName, setCourseName] = useState('');
  const [weeks, setWeeks] = useState<CourseWeek[]>([createEmptyWeek(1)]);
  const [activeWeekNum, setActiveWeekNum] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [drillSearch, setDrillSearch] = useState('');
  const [drillCategory, setDrillCategory] = useState('All');

  const selectedCourseId = state.curriculum.courseId;

  useEffect(() => {
    if (!editingCourseId) return;
    getCourseById(editingCourseId).then((course) => {
      setCourseName(course.name);
      setWeeks(course.weeks.length > 0 ? course.weeks : [createEmptyWeek(1)]);
      setActiveWeekNum(1);
      setIsDirty(false);
    }).catch(() => setWeeks([createEmptyWeek(1)]));
  }, [editingCourseId, getCourseById]);

  useEffect(() => {
    if (!saveMsg) return;
    const t = setTimeout(() => setSaveMsg(null), 3000);
    return () => clearTimeout(t);
  }, [saveMsg]);

  const handleSelectCourse = useCallback((course: Course) => {
    if (selectedCourseId === course.id) {
      updateCurriculum({ courseId: null, courseName: null, weekCount: null });
      setEditingCourseId(null);
    } else {
      updateCurriculum({ courseId: course.id, courseName: course.name, weekCount: course.weeks?.length ?? null });
      setEditingCourseId(course.id);
      setShowCreateForm(false);
    }
  }, [selectedCourseId, updateCurriculum]);

  const handleClearSelection = useCallback(() => {
    updateCurriculum({ courseId: null, courseName: null, weekCount: null });
    setEditingCourseId(null);
  }, [updateCurriculum]);

  const handleCreateCourse = useCallback(async () => {
    const trimmed = newCourseName.trim();
    if (!trimmed) { setCreateError('Course name is required.'); return; }
    setCreateError(null);
    setIsCreating(true);
    try {
      const created = await createCourse({ name: trimmed, weeks: [] });
      updateCurriculum({ courseId: created.id, courseName: created.name, weekCount: 0 });
      setEditingCourseId(created.id);
      setCourseName(created.name);
      setWeeks([createEmptyWeek(1)]);
      setActiveWeekNum(1);
      setIsDirty(false);
      setNewCourseName('');
      setShowCreateForm(false);
    } catch {
      setCreateError('Failed to create course. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [newCourseName, createCourse, updateCurriculum]);

  const handleAddWeek = () => {
    if (weeks.length >= MAX_WEEKS) return;
    const w = createEmptyWeek(weeks.length + 1);
    setWeeks((prev) => [...prev, w]);
    setActiveWeekNum(w.weekNumber);
    setIsDirty(true);
  };

  const handleRemoveWeek = (weekNumber: number) => {
    if (weeks.length <= 1) return;
    const updated = weeks.filter((w) => w.weekNumber !== weekNumber).map((w, i) => ({ ...w, weekNumber: i + 1 }));
    setWeeks(updated);
    setActiveWeekNum(updated[Math.min(weekNumber - 1, updated.length - 1)].weekNumber);
    setIsDirty(true);
  };

  const handleWeekUpdate = (weekNumber: number, field: 'focusArea' | 'objective', value: string) => {
    setWeeks((prev) => prev.map((w) => w.weekNumber === weekNumber ? { ...w, [field]: value } : w));
    setIsDirty(true);
  };

  const activeWeek = weeks.find((w) => w.weekNumber === activeWeekNum) ?? weeks[0];
  const assignedDrillIds = new Set(activeWeek?.drills.map((d) => d.id) ?? []);

  const availableDrills = allDrills.filter((d) => {
    if (assignedDrillIds.has(d.id)) return false;
    const matchSearch = d.name.toLowerCase().includes(drillSearch.toLowerCase());
    const matchCat = drillCategory === 'All' || d.category === drillCategory;
    return matchSearch && matchCat;
  });

  // Single-click: move drill from available → assigned
  const handleAddDrill = (drill: Drill) => {
    if (assignedDrillIds.has(drill.id)) return;
    setWeeks((prev) => prev.map((w) =>
      w.weekNumber === activeWeekNum ? { ...w, drills: [...w.drills, drill] } : w
    ));
    setIsDirty(true);
  };

  // Single-click: move drill from assigned → available (remove)
  const handleRemoveDrill = (drillId: string) => {
    setWeeks((prev) => prev.map((w) =>
      w.weekNumber === activeWeekNum ? { ...w, drills: w.drills.filter((d) => d.id !== drillId) } : w
    ));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!editingCourseId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateCourse(editingCourseId, { name: courseName.trim() || undefined, weeks });
      await refetch();
      updateCurriculum({ courseId: editingCourseId, courseName: courseName || state.curriculum.courseName, weekCount: weeks.length });
      setSaveMsg('Saved ✓');
      setIsDirty(false);
    } catch {
      setSaveError('Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  // Group available drills by category for label dividers
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
    <div className="curriculum-step">

      {loading && <div className="curriculum-step__loading">Loading courses…</div>}
      {error && !loading && (
        <div className="curriculum-step__error">
          <span>{error}</span>
          <button type="button" className="btn btn-secondary" onClick={refetch}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {showCreateForm && (
            <div className="curriculum-step__create-form" style={{ marginBottom: 'var(--space-md)' }}>
              <div className="curriculum-step__create-input-group">
                <input
                  type="text"
                  className="curriculum-step__create-input"
                  placeholder="Course name, e.g. Beginner Fundamentals"
                  value={newCourseName}
                  onChange={(e) => { setNewCourseName(e.target.value); if (createError) setCreateError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreateCourse(); } }}
                  disabled={isCreating}
                  autoFocus
                />
                {createError && <p className="curriculum-step__create-error">{createError}</p>}
              </div>
              <button type="button" className="btn-create-fee" onClick={handleCreateCourse} disabled={isCreating || !newCourseName.trim()}>
                {isCreating ? 'Creating…' : 'Create'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowCreateForm(false); setNewCourseName(''); setCreateError(null); }} style={{ padding: '8px 14px', fontSize: '13px' }}>
                Cancel
              </button>
            </div>
          )}

          <div className="curriculum-step__grid">
            {courses.map((course) => (
              <div
                key={course.id}
                className={`curriculum-step__card${selectedCourseId === course.id ? ' curriculum-step__card--selected' : ''}`}
                onClick={() => handleSelectCourse(course)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectCourse(course); } }}
                role="button" tabIndex={0}
                aria-pressed={selectedCourseId === course.id}
                aria-label={`Select course: ${course.name}`}
              >
                <h3 className="curriculum-step__card-name">{course.name}</h3>
                <p className="curriculum-step__card-meta">
                  {course.weeks?.length ?? 0} week{(course.weeks?.length ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
            {!showCreateForm && (
              <div
                className="curriculum-step__card curriculum-step__card--new"
                onClick={() => { setShowCreateForm(true); handleClearSelection(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowCreateForm(true); handleClearSelection(); } }}
                role="button" tabIndex={0} aria-label="Create new course"
              >
                <h3 className="curriculum-step__card-name" style={{ color: 'var(--text-tertiary)' }}>+</h3>
                <p className="curriculum-step__card-meta">New Course</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Selected badge — no "Editing:" prefix, unsaved dot next to save button */}
      {selectedCourseId && state.curriculum.courseName && (
        <div className="curriculum-step__summary">
          <span className="curriculum-step__summary-icon">📋</span>
          <span className="curriculum-step__summary-text">
            {state.curriculum.courseName}
            {state.curriculum.weekCount != null && state.curriculum.weekCount > 0 && (
              <> &middot; {state.curriculum.weekCount} week{state.curriculum.weekCount !== 1 ? 's' : ''}</>
            )}
          </span>
          <button type="button" className="curriculum-step__summary-clear" onClick={handleClearSelection} aria-label="Remove selected curriculum">✕</button>
        </div>
      )}

      {editingCourseId && (
        <div className="curriculum-step__editor-wrapper">

          {/* Header: course name input + unsaved indicator + save button */}
          <div className="curriculum-step__editor-header">
            <input
              type="text"
              value={courseName}
              onChange={(e) => { setCourseName(e.target.value); setIsDirty(true); }}
              placeholder="Course name"
              className="curriculum-step__create-input"
              style={{ flex: 1, maxWidth: '320px' }}
            />
            <div className="curriculum-step__editor-actions">
              {isDirty && !saveMsg && (
                <span style={{ fontSize: '11px', color: 'var(--color-warning)', fontWeight: 500 }}>● unsaved</span>
              )}
              {saveMsg && <span className="curriculum-step__save-ok">{saveMsg}</span>}
              {saveError && <span className="curriculum-step__save-err">{saveError}</span>}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                style={{ padding: '6px 18px', fontSize: '13px' }}
              >
                {isSaving ? 'Saving…' : 'Save Curriculum'}
              </button>
            </div>
          </div>

          {/* Week tabs */}
          <div className="curriculum-week-tabs" style={{ borderBottom: '1px solid var(--border-default)', padding: '0 var(--space-sm)' }}>
            {weeks.map((week) => (
              <button
                key={week.weekNumber}
                type="button"
                onClick={() => setActiveWeekNum(week.weekNumber)}
                className={`curriculum-week-tab${activeWeekNum === week.weekNumber ? ' curriculum-week-tab--active' : ''}`}
              >
                W{week.weekNumber}
                {weeks.length > 1 && activeWeekNum === week.weekNumber && (
                  <span
                    onClick={(e) => { e.stopPropagation(); handleRemoveWeek(week.weekNumber); }}
                    style={{ marginLeft: '6px', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '0.75rem' }}
                    role="button" aria-label={`Remove Week ${week.weekNumber}`}
                  >✕</span>
                )}
              </button>
            ))}
            {weeks.length < MAX_WEEKS && (
              <button type="button" onClick={handleAddWeek} className="curriculum-week-tab" aria-label="Add Week">+</button>
            )}
          </div>

          {/* Focus area */}
          {activeWeek && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)' }}>
              <input
                type="text"
                value={activeWeek.focusArea}
                onChange={(e) => handleWeekUpdate(activeWeek.weekNumber, 'focusArea', e.target.value)}
                placeholder="Focus area, e.g. Foundation — Grip and Basic Footwork"
                className="input"
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
                      {/* Category label divider */}
                      <div className="curriculum-step__drill-category-label">{group.category}</div>
                      {group.drills.map((drill) => {
                        const unavailable = drill.isAssignable === false;
                        return (
                          <div
                            key={drill.id}
                            className={`curriculum-step__drill-item ${unavailable ? 'curriculum-step__drill-item--unavailable' : 'curriculum-step__drill-item--clickable'}`}
                            onClick={() => !unavailable && handleAddDrill(drill)}
                            role="option"
                            aria-selected={false}
                            aria-disabled={unavailable}
                            tabIndex={0}
                            title={unavailable ? "This drill's pack is currently disabled" : 'Click to add to week'}
                            onKeyDown={(e) => { if (!unavailable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleAddDrill(drill); } }}
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

            {/* Middle: arrow column (kept for visual balance, arrows now informational) */}
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
                      onClick={() => handleRemoveDrill(drill.id)}
                      role="option"
                      aria-selected={false}
                      tabIndex={0}
                      title="Click to remove from week"
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRemoveDrill(drill.id); } }}
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
      )}
    </div>
  );
};

export default CurriculumStep;

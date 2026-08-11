import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DrillLibrary from '../components/DrillLibrary';
import { useCourses } from '../hooks/useCourses';
import type { CourseWeek, Course } from '../hooks/useCourses';
import type { Drill } from '../types';
import '../styles/pages.css';

/**
 * CourseManagementPage
 * Requirements: 1.1, 1.2, 1.5, 2.1-2.5, 3.1-3.3, 4.1, 4.2, 8.1-8.6
 *
 * Provides a dedicated UI for creating and editing reusable course templates.
 * Left panel: DrillLibrary (drag source)
 * Right panel: Course editor with dynamic week tabs
 */

const MAX_WEEKS = 52;

const createEmptyWeek = (weekNumber: number): CourseWeek => ({
  weekNumber,
  focusArea: '',
  objective: '',
  drills: [],
});

const CourseManagementPage: React.FC = () => {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [weeks, setWeeks] = useState<CourseWeek[]>([createEmptyWeek(1)]);
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string>('');
  const [apiError, setApiError] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string>('');

  const {
    courses,
    loading,
    error,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseById,
  } = useCourses();

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const resetEditor = useCallback(() => {
    setSelectedCourseId('');
    setCourseName('');
    setWeeks([createEmptyWeek(1)]);
    setActiveWeek(1);
    setIsDirty(false);
    setNameError('');
    setApiError('');
    setSaveMessage('');
  }, []);

  const loadCourse = useCallback(async (courseId: string) => {
    if (!courseId) {
      resetEditor();
      return;
    }
    try {
      const course = await getCourseById(courseId);
      setSelectedCourseId(course.id);
      setCourseName(course.name);
      setWeeks(course.weeks.length > 0 ? course.weeks : [createEmptyWeek(1)]);
      setActiveWeek(1);
      setIsDirty(false);
      setNameError('');
      setApiError('');
      setSaveMessage('');
    } catch {
      setApiError('Failed to load course. Please try again.');
    }
  }, [getCourseById, resetEditor]);

  // Clear save message after timeout
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // ─── Week Management ───────────────────────────────────────────────────────

  const handleAddWeek = () => {
    if (weeks.length >= MAX_WEEKS) return;
    const newWeek = createEmptyWeek(weeks.length + 1);
    setWeeks((prev) => [...prev, newWeek]);
    setActiveWeek(newWeek.weekNumber);
    setIsDirty(true);
  };

  const handleRemoveWeek = (weekNumber: number) => {
    if (weeks.length <= 1) return;
    if (!window.confirm(`Remove Week ${weekNumber}? The remaining weeks will be re-numbered.`)) return;

    const filtered = weeks.filter((w) => w.weekNumber !== weekNumber);
    // Re-number sequentially
    const renumbered = filtered.map((w, i) => ({ ...w, weekNumber: i + 1 }));
    setWeeks(renumbered);

    // Adjust active week if necessary
    if (activeWeek === weekNumber) {
      setActiveWeek(renumbered.length > 0 ? renumbered[0].weekNumber : 1);
    } else if (activeWeek > renumbered.length) {
      setActiveWeek(renumbered.length);
    }
    setIsDirty(true);
  };

  const handleWeekUpdate = (weekNumber: number, field: 'focusArea' | 'objective', value: string) => {
    setWeeks((prev) => prev.map((w) => w.weekNumber === weekNumber ? { ...w, [field]: value } : w));
    setIsDirty(true);
  };

  const handleDrillDrop = (weekNumber: number, drill: Drill) => {
    setWeeks((prev) => prev.map((w) => {
      if (w.weekNumber === weekNumber && !w.drills.some((d) => d.id === drill.id)) {
        return { ...w, drills: [...w.drills, drill] };
      }
      return w;
    }));
    setIsDirty(true);
  };

  const handleRemoveDrill = (weekNumber: number, drillId: string) => {
    setWeeks((prev) => prev.map((w) =>
      w.weekNumber === weekNumber ? { ...w, drills: w.drills.filter((d) => d.id !== drillId) } : w
    ));
    setIsDirty(true);
  };

  // ─── Save / Delete ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    // Validate
    const trimmedName = courseName.trim();
    if (!trimmedName) {
      setNameError('Course name is required');
      return;
    }
    setNameError('');

    if (weeks.length < 1) {
      setApiError('Course must have at least 1 week');
      return;
    }

    setIsSaving(true);
    setApiError('');
    setSaveMessage('');

    try {
      if (selectedCourseId) {
        // Update existing
        await updateCourse(selectedCourseId, { name: trimmedName, weeks });
        setSaveMessage('Course updated successfully.');
      } else {
        // Create new
        const created = await createCourse({ name: trimmedName, weeks });
        setSelectedCourseId(created.id);
        setSaveMessage('Course created successfully.');
      }
      setIsDirty(false);
    } catch (err: unknown) {
      // Handle 409 duplicate name
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
        if (axiosErr.response?.status === 409) {
          setApiError('A course with this name already exists. Please choose a different name.');
        } else {
          setApiError(axiosErr.response?.data?.error || 'Failed to save course. Please try again.');
        }
      } else {
        setApiError('Failed to save course. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourseId) return;
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    try {
      await deleteCourse(selectedCourseId);
      resetEditor();
      setSaveMessage('Course deleted.');
    } catch {
      setApiError('Failed to delete course. Please try again.');
    }
  };

  // ─── Course Selector ───────────────────────────────────────────────────────

  const handleCourseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = e.target.value;
    if (isDirty && !window.confirm('You have unsaved changes. Discard and switch course?')) return;
    void loadCourse(courseId);
  };

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (loading && courses.length === 0) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="section-stack">
            <div className="page-header">
              <div>
                <h1 className="page-header-title">Course Management</h1>
                <p className="page-header-subtitle">Loading courses...</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────────

  if (error && courses.length === 0) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="section-stack">
            <div className="page-header">
              <div>
                <h1 className="page-header-title">Course Management</h1>
                <p className="page-header-subtitle">Create and manage reusable course templates</p>
              </div>
            </div>
            <div className="card">
              <div className="alert-base alert-warning">
                <span className="alert-title">Error</span>
                <span className="alert-message"> — {error}</span>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">

          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Course Management</h1>
              <p className="page-header-subtitle">Create and manage reusable course templates</p>
            </div>
          </div>

          {/* Controls: Course selector + New Course + Course Name */}
          <div className="card">
            <div className="curriculum-controls">
              <div className="form-group-inline">
                <label className="text-label">Select Course</label>
                <select
                  value={selectedCourseId}
                  onChange={handleCourseSelect}
                  className="input"
                >
                  <option value="">— New Course —</option>
                  {courses.map((course: Course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.weeks.length}w)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-inline">
                <label className="text-label">Course Name</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => { setCourseName(e.target.value); setNameError(''); setIsDirty(true); }}
                  placeholder="e.g., Beginner 12-Week Program"
                  className="input"
                  maxLength={200}
                />
                {nameError && (
                  <span className="text-small" style={{ color: 'var(--color-danger, #dc2626)' }}>{nameError}</span>
                )}
              </div>

              <div className="form-group-inline form-group-inline--action">
                <button
                  onClick={resetEditor}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  New Course
                </button>
              </div>
            </div>

            {/* API Error / Save Message */}
            {apiError && (
              <div className="alert-base alert-warning" style={{ marginTop: 'var(--space-md)' }}>
                {apiError}
              </div>
            )}
            {saveMessage && (
              <div className="alert-base alert-success" style={{ marginTop: 'var(--space-md)' }}>
                {saveMessage}
              </div>
            )}
          </div>

          {/* Main: Drill Library + Course Editor */}
          <div className="curriculum-layout">
            {/* Drill Library */}
            <div className="curriculum-library">
              <DrillLibrary />
            </div>

            {/* Course Editor */}
            <div className="curriculum-editor">
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Week Tabs */}
                <div className="curriculum-week-tabs">
                  {weeks.map((week) => (
                    <button
                      key={week.weekNumber}
                      onClick={() => setActiveWeek(week.weekNumber)}
                      className={`curriculum-week-tab${activeWeek === week.weekNumber ? ' curriculum-week-tab--active' : ''}`}
                    >
                      W{week.weekNumber}
                      {weeks.length > 1 && activeWeek === week.weekNumber && (
                        <span
                          onClick={(e) => { e.stopPropagation(); handleRemoveWeek(week.weekNumber); }}
                          style={{ marginLeft: '6px', cursor: 'pointer', color: 'var(--color-danger, #dc2626)', fontSize: '0.75rem' }}
                          title={`Remove Week ${week.weekNumber}`}
                          role="button"
                          aria-label={`Remove Week ${week.weekNumber}`}
                        >
                          ✕
                        </span>
                      )}
                    </button>
                  ))}
                  {weeks.length < MAX_WEEKS && (
                    <button
                      onClick={handleAddWeek}
                      className="curriculum-week-tab"
                      title="Add Week"
                      aria-label="Add Week"
                    >
                      +
                    </button>
                  )}
                </div>

                {/* Active Week Content */}
                {weeks.map((week) =>
                  activeWeek === week.weekNumber && (
                    <div key={week.weekNumber} className="curriculum-week-content">
                      {/* Focus Area */}
                      <div className="form-group-stack">
                        <label className="text-label">Focus Area</label>
                        <input
                          type="text"
                          value={week.focusArea}
                          onChange={(e) => handleWeekUpdate(week.weekNumber, 'focusArea', e.target.value)}
                          placeholder="e.g., Foundation — Grip and Basic Footwork"
                          className="input"
                        />
                      </div>

                      {/* Weekly Objective */}
                      <div className="form-group-stack">
                        <label className="text-label">Weekly Objective</label>
                        <textarea
                          value={week.objective}
                          onChange={(e) => handleWeekUpdate(week.weekNumber, 'objective', e.target.value)}
                          placeholder="e.g., Establish proper grip habits and develop basic court coverage"
                          rows={2}
                          className="input"
                          style={{ height: 'auto', resize: 'vertical' }}
                        />
                      </div>

                      {/* Drills Drop Zone */}
                      <div className="form-group-stack">
                        <label className="text-label">Assigned Drills</label>
                        <div
                          className="curriculum-drop-zone"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const drillData = e.dataTransfer.getData('drill');
                            if (drillData) handleDrillDrop(week.weekNumber, JSON.parse(drillData));
                          }}
                        >
                          {week.drills.length === 0 ? (
                            <p className="curriculum-drop-zone__empty text-small">
                              Drag drills here from the library
                            </p>
                          ) : (
                            <div className="curriculum-drill-list">
                              {week.drills.map((drill) => (
                                <div key={drill.id} className="curriculum-drill-item">
                                  <div className="curriculum-drill-item__info">
                                    <span className="text-body" style={{ fontWeight: 'var(--weight-medium)' }}>
                                      {drill.name}
                                    </span>
                                    <span className="badge badge-secondary" style={{ marginTop: '2px' }}>
                                      {drill.category}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveDrill(week.weekNumber, drill.id)}
                                    className="curriculum-drill-item__remove"
                                    aria-label={`Remove ${drill.name}`}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Footer: Save / Delete / Unsaved indicator */}
              <div className="card" style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  {isSaving ? 'Saving...' : selectedCourseId ? 'Update Course' : 'Create Course'}
                </button>

                {selectedCourseId && (
                  <button
                    onClick={handleDelete}
                    className="btn btn-secondary"
                    style={{ color: 'var(--color-danger, #dc2626)' }}
                  >
                    Delete Course
                  </button>
                )}

                {isDirty && (
                  <span className="text-small" style={{ color: 'var(--color-warning, #f59e0b)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-warning, #f59e0b)', display: 'inline-block' }} />
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseManagementPage;

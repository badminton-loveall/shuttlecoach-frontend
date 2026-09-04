import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { CurriculumWeekEditor } from '../components/CurriculumWeekEditor';
import { useCourses } from '../hooks/useCourses';
import type { CourseWeek, Course } from '../hooks/useCourses';
import type { Drill } from '../types';
import '../styles/pages.css';

/**
 * CourseManagementPage
 *
 * Dedicated CRUD page for reusable curriculum course templates.
 * Master-detail layout: course list (left) + week editor (right), using the same
 * click-based drill transfer editor as the student's individual curriculum page.
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

  // ─── Course List Selection ─────────────────────────────────────────────────

  const handleCourseSelect = (courseId: string) => {
    if (courseId === selectedCourseId) return;
    if (isDirty && !window.confirm('You have unsaved changes. Discard and switch course?')) return;
    void loadCourse(courseId);
  };

  const handleNewCourseClick = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and start a new course?')) return;
    resetEditor();
  };

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

  const handleWeekFieldChange = (weekNumber: number, field: 'focusArea' | 'objective', value: string) => {
    setWeeks((prev) => prev.map((w) => w.weekNumber === weekNumber ? { ...w, [field]: value } : w));
    setIsDirty(true);
  };

  const handleAddDrill = (weekNumber: number, drill: Drill) => {
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

  const handleDelete = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    try {
      await deleteCourse(courseId);
      if (courseId === selectedCourseId) resetEditor();
      setSaveMessage('Course deleted.');
    } catch {
      setApiError('Failed to delete course. Please try again.');
    }
  };

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (loading && courses.length === 0) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="section-stack">
            <div className="page-header">
              <div>
                <h1 className="page-header-title">Curriculum</h1>
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
                <h1 className="page-header-title">Curriculum</h1>
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
              <h1 className="page-header-title">Curriculum</h1>
              <p className="page-header-subtitle">Create and manage reusable course templates</p>
            </div>
          </div>

          {/* API Error / Save Message */}
          {apiError && (
            <div className="alert-base alert-warning">{apiError}</div>
          )}
          {saveMessage && (
            <div className="alert-base alert-success">{saveMessage}</div>
          )}

          {/* Main: Course List | Editor */}
          <div className="curriculum-layout">
            {/* Left column: course list */}
            <div className="curriculum-library">
              <div className="course-list-panel">
                <div className="course-list-panel__header">
                  <span className="course-list-panel__title">Courses ({courses.length})</span>
                  <button
                    onClick={handleNewCourseClick}
                    className="btn-create-fee"
                    aria-label="New course"
                    title="New course"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                    New
                  </button>
                </div>

                <div className="course-list-panel__items">
                  {courses.length === 0 && (
                    <p className="text-small course-list-panel__empty">No courses yet — create your first one.</p>
                  )}
                  {courses.map((course: Course) => (
                    <div
                      key={course.id}
                      className={`course-list-card${selectedCourseId === course.id ? ' course-list-card--active' : ''}`}
                      onClick={() => handleCourseSelect(course.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="course-list-card__main">
                        <span className="course-list-card__name">{course.name}</span>
                        <span className="badge badge-secondary course-list-card__weeks">{course.weeks.length}w</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); void handleDelete(course.id); }}
                        className="course-list-card__delete"
                        aria-label={`Delete ${course.name}`}
                        title="Delete course"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Course Editor */}
            <div className="curriculum-editor">
              <div className="card course-editor-header" style={{ marginBottom: 'var(--space-md)' }}>
                <div className="form-group-stack" style={{ flex: 1 }}>
                  <label htmlFor="course-name" className="form-label">Course Title</label>
                  <input
                    id="course-name"
                    type="text"
                    value={courseName}
                    onChange={(e) => { setCourseName(e.target.value); setNameError(''); setIsDirty(true); }}
                    placeholder="e.g., Beginner 12-Week Program"
                    className="input course-editor-header__name-input"
                    maxLength={200}
                  />
                  {nameError && (
                    <span className="text-small" style={{ color: 'var(--color-danger)' }}>{nameError}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  {isDirty && (
                    <span className="course-editor-header__dirty">
                      <span className="course-editor-header__dirty-dot" />
                      Unsaved
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !courseName.trim()}
                    className="btn btn-primary"
                    style={{ width: 'auto', whiteSpace: 'nowrap' }}
                  >
                    {isSaving ? 'Saving...' : selectedCourseId ? 'Update Course' : 'Create Course'}
                  </button>
                </div>
              </div>

              <CurriculumWeekEditor
                weeks={weeks}
                activeWeekNum={activeWeek}
                onActiveWeekChange={setActiveWeek}
                onWeekFieldChange={handleWeekFieldChange}
                onAddWeek={handleAddWeek}
                onRemoveWeek={handleRemoveWeek}
                onAddDrill={handleAddDrill}
                onRemoveDrill={handleRemoveDrill}
                maxWeeks={MAX_WEEKS}
              />
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseManagementPage;

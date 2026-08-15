import React, { useState, useCallback } from 'react';
import { useWizard } from './WizardContext';
import { useCourses } from '../../hooks/useCourses';
import type { Course } from '../../hooks/useCourses';
import './CurriculumStep.css';

/**
 * CurriculumStep Component
 * Wizard Step 2: Select or create a curriculum (course) for the batch.
 * Displays courses as selectable cards, with an inline "Create New" form.
 * Curriculum selection is optional — the user can skip this step.
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

export const CurriculumStep: React.FC = () => {
  const { state, updateCurriculum } = useWizard();
  const { courses, loading, error, createCourse, refetch } = useCourses();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const selectedCourseId = state.curriculum.courseId;

  /**
   * Handle selecting a course card. Toggle selection if already selected.
   */
  const handleSelectCourse = useCallback(
    (course: Course) => {
      if (selectedCourseId === course.id) {
        // Deselect
        updateCurriculum({ courseId: null, courseName: null, weekCount: null });
      } else {
        // Select
        updateCurriculum({
          courseId: course.id,
          courseName: course.name,
          weekCount: course.weeks?.length ?? null,
        });
      }
    },
    [selectedCourseId, updateCurriculum]
  );

  /**
   * Handle inline course creation (name only — minimal form).
   */
  const handleCreateCourse = useCallback(async () => {
    const trimmedName = newCourseName.trim();
    if (!trimmedName) {
      setCreateError('Course name is required.');
      return;
    }

    setCreateError(null);
    setIsCreating(true);

    try {
      const created = await createCourse({ name: trimmedName, weeks: [] });
      // Auto-select the newly created course
      updateCurriculum({
        courseId: created.id,
        courseName: created.name,
        weekCount: created.weeks?.length ?? 0,
      });
      // Reset form state
      setNewCourseName('');
      setShowCreateForm(false);
    } catch {
      setCreateError('Failed to create course. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [newCourseName, createCourse, updateCurriculum]);

  /**
   * Handle clearing the selected curriculum.
   */
  const handleClearSelection = useCallback(() => {
    updateCurriculum({ courseId: null, courseName: null, weekCount: null });
  }, [updateCurriculum]);

  /**
   * Handle key press in the create form input (submit on Enter).
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleCreateCourse();
    }
  };

  return (
    <div className="curriculum-step">
      {/* Section Header */}
      <div className="curriculum-step__header">
        <h2 className="curriculum-step__title">Curriculum Preparation</h2>
        <p className="curriculum-step__hint">
          Select a curriculum to attach, or skip this step — it&apos;s optional.
        </p>
      </div>

      {/* Selected Summary */}
      {selectedCourseId && state.curriculum.courseName && (
        <div className="curriculum-step__summary">
          <span className="curriculum-step__summary-icon">📋</span>
          <span className="curriculum-step__summary-text">
            {state.curriculum.courseName}
            {state.curriculum.weekCount != null && state.curriculum.weekCount > 0 && (
              <> &middot; {state.curriculum.weekCount} week{state.curriculum.weekCount !== 1 ? 's' : ''}</>
            )}
          </span>
          <button
            type="button"
            className="curriculum-step__summary-clear"
            onClick={handleClearSelection}
            aria-label="Remove selected curriculum"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="curriculum-step__loading">Loading courses…</div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="curriculum-step__error">
          <span>{error}</span>
          <button type="button" className="btn btn-secondary" onClick={refetch}>
            Retry
          </button>
        </div>
      )}

      {/* Course Card Grid */}
      {!loading && !error && (
        <>
          {courses.length === 0 ? (
            <div className="curriculum-step__empty">
              No courses available. Create one below to get started.
            </div>
          ) : (
            <div className="curriculum-step__grid">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`curriculum-step__card${
                    selectedCourseId === course.id ? ' curriculum-step__card--selected' : ''
                  }`}
                  onClick={() => handleSelectCourse(course)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectCourse(course);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedCourseId === course.id}
                  aria-label={`Select course: ${course.name}`}
                >
                  <h3 className="curriculum-step__card-name">{course.name}</h3>
                  <p className="curriculum-step__card-meta">
                    {course.weeks?.length ?? 0} week{(course.weeks?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create New Course Section */}
      {!loading && !error && (
        <div className="curriculum-step__create-section">
          <button
            type="button"
            className="curriculum-step__create-toggle"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <span
              className={`curriculum-step__create-toggle-icon${
                showCreateForm ? ' curriculum-step__create-toggle-icon--open' : ''
              }`}
            >
              +
            </span>
            {showCreateForm ? 'Cancel' : 'Create New Course'}
          </button>

          {showCreateForm && (
            <div className="curriculum-step__create-form">
              <div className="curriculum-step__create-input-group">
                <label className="curriculum-step__create-label" htmlFor="new-course-name">
                  Course Name
                </label>
                <input
                  id="new-course-name"
                  type="text"
                  className="curriculum-step__create-input"
                  placeholder="e.g. Beginner Fundamentals"
                  value={newCourseName}
                  onChange={(e) => {
                    setNewCourseName(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isCreating}
                  autoFocus
                />
                {createError && (
                  <p className="curriculum-step__create-error">{createError}</p>
                )}
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateCourse}
                disabled={isCreating || !newCourseName.trim()}
              >
                {isCreating ? 'Creating…' : 'Create'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CurriculumStep;

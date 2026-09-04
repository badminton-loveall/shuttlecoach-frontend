import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { CurriculumWeekEditor } from '../components/CurriculumWeekEditor';
import { CurriculumReassignConfirmDialog } from '../components/CurriculumReassignConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { generateCycleKey } from '../utils/skillUtils';
import { useCurriculum } from '../hooks/useCurriculum';
import { useStudent } from '../hooks/useStudent';
import { useStudentEnrollments } from '../hooks/useStudentEnrollments';
import { useStudentDrillRecords } from '../hooks/useStudentDrillRecords';
import type { CurriculumPlan, WeekPlan, Drill } from '../types';
import '../styles/pages.css';

/**
 * IndividualCurriculumPage
 * Manages the curriculum for a single student's active enrollment — the plan is derived from
 * their current enrollment rather than a manually-picked bi-monthly cycle. Shows deviations
 * from a legacy batch plan if this plan was originally cloned from one.
 */

const IndividualCurriculumPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  // Fetch student data from API
  const { student, loading: studentLoading, error: studentError } = useStudent(studentId);

  // The student's active enrollment drives which curriculum this page manages
  const { activeEnrollment, loading: enrollmentLoading } = useStudentEnrollments(studentId);

  // Fetch curriculum plans from API
  const {
    plans,
    loading: curriculumLoading,
    error: curriculumError,
    createPlan,
    updatePlan,
  } = useCurriculum({ studentId });

  // Durable drill ledger for this enrollment — used to detect existing progress before reassigning
  const { records: drillRecords } = useStudentDrillRecords(studentId, activeEnrollment?.id);

  const [currentPlan, setCurrentPlan] = useState<CurriculumPlan | null>(null);
  const [batchPlan, setBatchPlan] = useState<CurriculumPlan | null>(null);
  const [weeks, setWeeks] = useState<WeekPlan[]>([]);
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [showReassignConfirm, setShowReassignConfirm] = useState(false);

  // Check permissions and redirect if needed
  useEffect(() => {
    if (!studentId) {
      navigate('/students');
      return;
    }

    if (!studentLoading && !student && !studentError) {
      navigate('/students');
      return;
    }

    if (student && role === 'ASSISTANT_COACH' && student.assignedCoachId !== user?.id) {
      navigate('/access-denied');
      return;
    }
  }, [studentId, student, studentLoading, studentError, role, user, navigate]);

  // Load the student's current (most recent, non-archived) curriculum plan
  useEffect(() => {
    if (!student || curriculumLoading) return;

    const studentPlans = plans
      .filter((p) => p.studentId === student.id && !p.isArchived)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const latestPlan = studentPlans[0] || null;

    if (latestPlan) {
      setCurrentPlan(latestPlan);
      setWeeks(latestPlan.weeks as WeekPlan[]);

      if (latestPlan.sourceBatchPlanId) {
        const sourcePlan = plans.find((p) => p.id === latestPlan.sourceBatchPlanId);
        setBatchPlan(sourcePlan || null);
      } else {
        setBatchPlan(null);
      }
    } else {
      const emptyWeeks: WeekPlan[] = [
        { weekNumber: 1, focusArea: '', drills: [], objective: '' },
      ];
      setCurrentPlan(null);
      setWeeks(emptyWeeks);
      setBatchPlan(null);
    }
    setActiveWeek(1);
  }, [student, plans, curriculumLoading]);

  const cycleKey = useMemo(() => {
    if (activeEnrollment?.startDate) {
      return generateCycleKey(new Date(`${activeEnrollment.startDate}T00:00:00`));
    }
    return generateCycleKey();
  }, [activeEnrollment]);

  // Check if a week has been modified from a legacy batch plan
  const hasWeekChanged = (weekNumber: number): boolean => {
    if (!batchPlan) return false;

    const currentWeek = weeks.find((w) => w.weekNumber === weekNumber);
    const batchWeek = batchPlan.weeks.find((w) => w.weekNumber === weekNumber);

    if (!currentWeek || !batchWeek) return false;

    if (currentWeek.focusArea !== batchWeek.focusArea) return true;
    if (currentWeek.objective !== batchWeek.objective) return true;

    const currentDrillIds = currentWeek.drills.map((d) => d.id).sort().join(',');
    const batchDrillIds = batchWeek.drills.map((d) => d.id).sort().join(',');

    return currentDrillIds !== batchDrillIds;
  };

  const getWeekChanges = (weekNumber: number): string[] => {
    if (!batchPlan) return [];

    const changes: string[] = [];
    const currentWeek = weeks.find((w) => w.weekNumber === weekNumber);
    const batchWeek = batchPlan.weeks.find((w) => w.weekNumber === weekNumber);

    if (!currentWeek || !batchWeek) return changes;

    if (currentWeek.focusArea !== batchWeek.focusArea) changes.push('Focus area modified');
    if (currentWeek.objective !== batchWeek.objective) changes.push('Objective modified');

    const currentDrillIds = currentWeek.drills.map((d) => d.id).sort();
    const batchDrillIds = batchWeek.drills.map((d) => d.id).sort();

    if (currentDrillIds.join(',') !== batchDrillIds.join(',')) {
      const added = currentDrillIds.filter((id) => !batchDrillIds.includes(id));
      const removed = batchDrillIds.filter((id) => !currentDrillIds.includes(id));
      if (added.length > 0) changes.push(`${added.length} drill(s) added`);
      if (removed.length > 0) changes.push(`${removed.length} drill(s) removed`);
    }

    return changes;
  };

  const handleWeekFieldChange = (weekNumber: number, field: 'focusArea' | 'objective', value: string) => {
    setWeeks((prev) => prev.map((w) => (w.weekNumber === weekNumber ? { ...w, [field]: value } : w)));
  };

  const handleAddWeek = () => {
    if (weeks.length >= 52) return;
    const newWeek: WeekPlan = { weekNumber: weeks.length + 1, focusArea: '', drills: [], objective: '' };
    setWeeks((prev) => [...prev, newWeek]);
    setActiveWeek(newWeek.weekNumber);
  };

  const handleRemoveWeek = (weekNumber: number) => {
    if (weeks.length <= 1) return;
    if (!window.confirm(`Remove Week ${weekNumber}? The remaining weeks will be re-numbered.`)) return;
    const renumbered = weeks
      .filter((w) => w.weekNumber !== weekNumber)
      .map((w, i) => ({ ...w, weekNumber: i + 1 }));
    setWeeks(renumbered);
    setActiveWeek(Math.min(activeWeek, renumbered.length));
  };

  const handleAddDrill = (weekNumber: number, drill: Drill) => {
    setWeeks((prevWeeks) =>
      prevWeeks.map((week) => {
        if (week.weekNumber === weekNumber && !week.drills.some((d) => d.id === drill.id)) {
          return { ...week, drills: [...week.drills, drill] };
        }
        return week;
      })
    );
  };

  const handleRemoveDrill = (weekNumber: number, drillId: string) => {
    setWeeks((prevWeeks) =>
      prevWeeks.map((week) =>
        week.weekNumber === weekNumber
          ? { ...week, drills: week.drills.filter((d) => d.id !== drillId) }
          : week
      )
    );
  };

  const hasExistingProgress = (): boolean => drillRecords.some((r) => r.status === 'trained');
  const getProgressWeek = (): number =>
    drillRecords.length > 0 ? Math.max(...drillRecords.map((r) => r.weekNumber)) : 1;

  const handleSavePlan = async () => {
    if (!student) {
      setSaveMessage('Student not found');
      return;
    }

    if (!currentPlan && hasExistingProgress()) {
      setShowReassignConfirm(true);
      return;
    }

    await executeSave();
  };

  const executeSave = async () => {
    if (!student) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      if (currentPlan) {
        await updatePlan(currentPlan.id, { weeks });
      } else {
        const newPlan = await createPlan({
          cycleKey,
          studentId: student.id,
          weeks,
        });
        setCurrentPlan(newPlan);
      }

      setSaveMessage('Curriculum saved successfully!');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (error) {
      setSaveMessage('Error saving plan. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmReassign = async () => {
    setShowReassignConfirm(false);
    await executeSave();
  };

  const handleCancelReassign = () => setShowReassignConfirm(false);

  // Loading state
  if (studentLoading || curriculumLoading || enrollmentLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center" style={{ height: '24rem' }}>
          <div className="text-secondary">Loading curriculum data...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (studentError || curriculumError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center" style={{ height: '24rem' }}>
          <div className="text-center">
            <p className="text-red-600 mb-2">{studentError || curriculumError}</p>
            <button onClick={() => navigate('/students')} className="btn btn-secondary btn-sm">
              Back to Students
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center" style={{ height: '24rem' }}>
          <div className="text-secondary">Student not found.</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">

          {/* Warning Banner - Shows if plan was copied from a legacy batch plan */}
          {batchPlan && (
            <div className="alert-base alert-warning">
              <div className="alert-base__content">
                <h3 className="alert-base__title">Individual Plan (Copied from Batch)</h3>
                <p className="alert-base__message">
                  This plan was originally copied from a batch curriculum. Changes you make here
                  will only affect <strong>{student.fullName}</strong>. Modified weeks are highlighted below.
                </p>
              </div>
            </div>
          )}

          {/* Diff badge for the active week */}
          {hasWeekChanged(activeWeek) && (
            <div className="alert-base alert-warning">
              <div className="alert-base__content">
                <p className="alert-base__title">Week {activeWeek} modified from batch plan</p>
                <p className="alert-base__message">{getWeekChanges(activeWeek).join(', ')}</p>
              </div>
            </div>
          )}

          {/* Week + Drill Editor */}
          <CurriculumWeekEditor
            weeks={weeks}
            activeWeekNum={activeWeek}
            onActiveWeekChange={setActiveWeek}
            onWeekFieldChange={handleWeekFieldChange}
            onAddWeek={handleAddWeek}
            onRemoveWeek={handleRemoveWeek}
            onAddDrill={handleAddDrill}
            onRemoveDrill={handleRemoveDrill}
            headerContent={
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <button
                    type="button"
                    className="sp-back-arrow"
                    onClick={() => navigate(`/student/${student.id}`)}
                    aria-label="Back to student profile"
                    title="Back to student profile"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M5 12l7 7M5 12l7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <h2 className="curriculum-step__header-title">
                    Weekly Curriculum — {student.fullName}
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  {saveMessage && (
                    <span
                      className="text-small"
                      style={{ color: saveMessage.includes('Error') ? 'var(--color-danger)' : 'var(--color-success)' }}
                    >
                      {saveMessage}
                    </span>
                  )}
                  <button onClick={handleSavePlan} disabled={isSaving} className="btn btn-primary">
                    {isSaving ? 'Saving...' : 'Save Curriculum'}
                  </button>
                </div>
              </>
            }
          />

        </div>
      </div>

      {/* Curriculum Reassignment Confirmation Dialog */}
      <CurriculumReassignConfirmDialog
        isOpen={showReassignConfirm}
        studentName={student.fullName}
        currentWeek={getProgressWeek()}
        onConfirm={confirmReassign}
        onCancel={handleCancelReassign}
        isLoading={isSaving}
      />
    </DashboardLayout>
  );
};

export default IndividualCurriculumPage;

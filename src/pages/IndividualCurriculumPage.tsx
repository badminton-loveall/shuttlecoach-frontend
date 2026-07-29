import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import DrillLibrary from '../components/DrillLibrary';
import { useAuth } from '../contexts/AuthContext';
import { generateCycleKey, isCycleArchived, getAllCyclesFromPlans } from '../utils/skillUtils';
import type { CurriculumPlan, WeekPlan, Drill, Student } from '../types';
import curriculumData from '../data/curriculum.json';
import studentsData from '../data/students.json';
import '../styles/pages.css';

/**
 * IndividualCurriculumPage
 * Manages curriculum editing for individual students with diff indicators
 * Shows deviations from batch plans, prevents editing of archived plans
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4
 */

const IndividualCurriculumPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [availableCycles, setAvailableCycles] = useState<string[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CurriculumPlan | null>(null);
  const [batchPlan, setBatchPlan] = useState<CurriculumPlan | null>(null);
  const [weeks, setWeeks] = useState<WeekPlan[]>([]);
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isArchived, setIsArchived] = useState(false);

  // Load student data and check permissions
  useEffect(() => {
    if (!studentId) {
      navigate('/students');
      return;
    }

    const foundStudent = studentsData.find((s) => s.id === studentId);
    if (!foundStudent) {
      navigate('/students');
      return;
    }

    // Check permission: Head Coach or assigned Assistant Coach only
    if (role === 'ASSISTANT_COACH' && foundStudent.assignedCoachId !== user?.id) {
      navigate('/access-denied');
      return;
    }

    // Convert dates from JSON strings to Date objects and null to undefined
    const studentWithDates: Student = {
      ...foundStudent,
      dateOfBirth: new Date(foundStudent.dateOfBirth),
      createdAt: new Date(foundStudent.createdAt),
      updatedAt: new Date(foundStudent.updatedAt),
      email: foundStudent.email || undefined,
      baidNumber: foundStudent.baidNumber || undefined,
      guardianName: foundStudent.guardianName || undefined,
      guardianPhone: foundStudent.guardianPhone || undefined,
      batchId: foundStudent.batchId || undefined,
      assignedCoachId: foundStudent.assignedCoachId || undefined,
      profilePhoto: foundStudent.profilePhoto || undefined,
      height: foundStudent.height || undefined,
      weight: foundStudent.weight || undefined,
      bmi: foundStudent.bmi || undefined,
      bloodGroup: foundStudent.bloodGroup || undefined,
      medicalConditions: foundStudent.medicalConditions || undefined,
      emergencyContact: foundStudent.emergencyContact || undefined,
      coachFeedback: foundStudent.coachFeedback || undefined,
    } as Student;

    setStudent(studentWithDates);

    // Initialize current cycle
    const currentCycle = generateCycleKey();
    setSelectedCycle(currentCycle);

    // Get available cycles from student's plans
    const storedPlans = localStorage.getItem('curriculumPlans');
    const plansData = storedPlans ? JSON.parse(storedPlans) : curriculumData;
    
    // Filter plans for this student
    const studentPlans = plansData.filter((p: any) => p.studentId === studentId);
    const cycles = getAllCyclesFromPlans(studentPlans);
    
    setAvailableCycles(cycles);
  }, [studentId, role, user, navigate]);

  // Load curriculum when cycle changes
  useEffect(() => {
    if (!student || !selectedCycle) return;

    // Check if cycle is archived
    const archived = isCycleArchived(selectedCycle);
    setIsArchived(archived);

    const storedPlans = localStorage.getItem('curriculumPlans');
    const plansData = storedPlans ? JSON.parse(storedPlans) : curriculumData;

    // Find individual plan for this student and cycle
    const individualPlan = plansData.find(
      (p: any) => p.studentId === student.id && p.cycleKey === selectedCycle
    );

    if (individualPlan) {
      setCurrentPlan(individualPlan);
      setWeeks(individualPlan.weeks as WeekPlan[]);

      // If plan has a source batch plan, load it for comparison
      if (individualPlan.sourceBatchPlanId) {
        const sourcePlan = plansData.find(
          (p: any) => p.id === individualPlan.sourceBatchPlanId
        );
        setBatchPlan(sourcePlan || null);
      } else {
        setBatchPlan(null);
      }
    } else {
      // No plan exists, create empty structure
      const emptyWeeks: WeekPlan[] = Array.from({ length: 8 }, (_, i) => ({
        weekNumber: (i + 1) as WeekPlan['weekNumber'],
        focusArea: '',
        drills: [],
        objective: ''
      }));
      
      setCurrentPlan(null);
      setWeeks(emptyWeeks);
      setBatchPlan(null);
    }
  }, [student, selectedCycle]);

  // Check if a week has been modified from batch plan
  const hasWeekChanged = (weekNumber: number): boolean => {
    if (!batchPlan) return false;

    const currentWeek = weeks.find((w) => w.weekNumber === weekNumber);
    const batchWeek = batchPlan.weeks.find((w) => w.weekNumber === weekNumber);

    if (!currentWeek || !batchWeek) return false;

    // Compare focus area
    if (currentWeek.focusArea !== batchWeek.focusArea) return true;

    // Compare objective
    if (currentWeek.objective !== batchWeek.objective) return true;

    // Compare drills (by ID)
    const currentDrillIds = currentWeek.drills.map((d) => d.id).sort().join(',');
    const batchDrillIds = batchWeek.drills.map((d) => d.id).sort().join(',');
    
    return currentDrillIds !== batchDrillIds;
  };

  // Get specific changes for a week
  const getWeekChanges = (weekNumber: number): string[] => {
    if (!batchPlan) return [];

    const changes: string[] = [];
    const currentWeek = weeks.find((w) => w.weekNumber === weekNumber);
    const batchWeek = batchPlan.weeks.find((w) => w.weekNumber === weekNumber);

    if (!currentWeek || !batchWeek) return changes;

    if (currentWeek.focusArea !== batchWeek.focusArea) {
      changes.push('Focus area modified');
    }

    if (currentWeek.objective !== batchWeek.objective) {
      changes.push('Objective modified');
    }

    const currentDrillIds = currentWeek.drills.map((d) => d.id).sort();
    const batchDrillIds = batchWeek.drills.map((d) => d.id).sort();
    
    if (currentDrillIds.join(',') !== batchDrillIds.join(',')) {
      const added = currentDrillIds.filter((id) => !batchDrillIds.includes(id));
      const removed = batchDrillIds.filter((id) => !currentDrillIds.includes(id));
      
      if (added.length > 0) {
        changes.push(`${added.length} drill(s) added`);
      }
      if (removed.length > 0) {
        changes.push(`${removed.length} drill(s) removed`);
      }
    }

    return changes;
  };

  const handleWeekUpdate = (weekNumber: number, field: keyof WeekPlan, value: string) => {
    if (isArchived) {
      setSaveMessage('Cannot edit archived curriculum plans');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setWeeks((prevWeeks) =>
      prevWeeks.map((week) =>
        week.weekNumber === weekNumber
          ? { ...week, [field]: value }
          : week
      )
    );
  };

  const handleDrillDrop = (weekNumber: number, drill: Drill) => {
    if (isArchived) {
      setSaveMessage('Cannot edit archived curriculum plans');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setWeeks((prevWeeks) =>
      prevWeeks.map((week) => {
        if (week.weekNumber === weekNumber) {
          const drillExists = week.drills.some((d) => d.id === drill.id);
          if (!drillExists) {
            return {
              ...week,
              drills: [...week.drills, drill]
            };
          }
        }
        return week;
      })
    );
  };

  const handleRemoveDrill = (weekNumber: number, drillId: string) => {
    if (isArchived) {
      setSaveMessage('Cannot edit archived curriculum plans');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setWeeks((prevWeeks) =>
      prevWeeks.map((week) =>
        week.weekNumber === weekNumber
          ? { ...week, drills: week.drills.filter((d) => d.id !== drillId) }
          : week
      )
    );
  };

  const handleSavePlan = async () => {
    if (isArchived) {
      setSaveMessage('Cannot edit archived curriculum plans');
      return;
    }

    if (!student) {
      setSaveMessage('Student not found');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const timestamp = Date.now();
      const planId = currentPlan?.id || `curriculum-${timestamp}-student`;

      const updatedPlan: CurriculumPlan = {
        id: planId,
        cycleKey: selectedCycle,
        batchId: undefined,
        studentId: student.id,
        sourceBatchPlanId: currentPlan?.sourceBatchPlanId,
        weeks: weeks,
        createdAt: currentPlan?.createdAt || new Date(),
        updatedAt: new Date(),
        isArchived: isCycleArchived(selectedCycle)
      };

      // Load existing plans
      const storedPlans = localStorage.getItem('curriculumPlans');
      const existingPlans = storedPlans ? JSON.parse(storedPlans) : [...curriculumData];

      // Remove old version of this plan if it exists
      const filteredPlans = existingPlans.filter(
        (p: CurriculumPlan) => 
          !(p.studentId === student.id && p.cycleKey === selectedCycle)
      );

      // Add updated plan
      const updatedPlans = [...filteredPlans, updatedPlan];

      // Save to localStorage
      localStorage.setItem('curriculumPlans', JSON.stringify(updatedPlans));

      setCurrentPlan(updatedPlan);
      setSaveMessage('Individual curriculum plan saved successfully!');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (error) {
      setSaveMessage('Error saving plan. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center" style={{ height: '24rem' }}>
          <div className="text-secondary">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">

          {/* Page Header */}
          <div>
            <button
              onClick={() => navigate('/students')}
              className="btn btn-secondary btn-sm"
              style={{ marginBottom: 'var(--space-md)' }}
            >
              <span>←</span> Back to Students
            </button>
            <h1 className="page-header-title">
              Individual Curriculum - {student.fullName}
            </h1>
            <p className="page-header-subtitle">
              Edit curriculum plan for this student
            </p>
          </div>

          {/* Warning Banner - Shows if plan was copied from batch */}
          {batchPlan && !isArchived && (
            <div className="alert-base alert-warning">
              <svg
                className="alert-base__icon"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="alert-base__content">
                <h3 className="alert-base__title">
                  Individual Plan (Copied from Batch)
                </h3>
                <p className="alert-base__message">
                  This plan was originally copied from a batch curriculum. Changes you make here
                  will only affect <strong>{student.fullName}</strong> and will not impact the
                  batch plan or other students. Modified weeks are highlighted with a yellow badge.
                </p>
              </div>
            </div>
          )}

          {/* Archived Plan Warning */}
          {isArchived && (
            <div className="alert-base alert-info">
              <svg
                className="alert-base__icon"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="alert-base__content">
                <h3 className="alert-base__title">
                  Archived Plan (Read-Only)
                </h3>
                <p className="alert-base__message">
                  This curriculum plan is from a past cycle and cannot be edited. It is preserved
                  for historical reference only.
                </p>
              </div>
            </div>
          )}

          {/* Controls Section */}
          <div className="card">
            <div className="curriculum-controls">
              {/* Cycle Selector */}
              <div className="form-group-inline">
                <label className="text-label">
                  Bi-monthly Cycle
                </label>
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="input"
                >
                  {availableCycles.map((cycle) => (
                    <option key={cycle} value={cycle}>
                      {cycle} {isCycleArchived(cycle) ? '(Archived)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Info */}
              <div className="form-group-inline">
                <label className="text-label">
                  Student
                </label>
                <div className="input" style={{ opacity: 0.7, cursor: 'default' }}>
                  {student.fullName}
                </div>
              </div>

              {/* Save Button */}
              <div className="form-group-inline form-group-inline--action">
                <button
                  onClick={handleSavePlan}
                  disabled={isSaving || isArchived}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {isSaving ? 'Saving...' : 'Save Individual Plan'}
                </button>
              </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div
                className={
                  saveMessage.includes('Error') || saveMessage.includes('Cannot')
                    ? 'alert-base alert-warning'
                    : 'alert-base alert-success'
                }
                style={{ marginTop: 'var(--space-md)' }}
              >
                {saveMessage}
              </div>
            )}
          </div>

          {/* Main Content: Drill Library + Week Editor */}
          <div className="curriculum-layout">
            {/* Drill Library (Left Side) */}
            <div className="curriculum-library">
              <DrillLibrary />
            </div>

            {/* 8-Week Editor (Right Side) */}
            <div className="curriculum-editor">
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Week Tabs */}
                <div className="curriculum-week-tabs">
                  {weeks.map((week) => {
                    const hasChanges = hasWeekChanged(week.weekNumber);
                    return (
                      <button
                        key={week.weekNumber}
                        onClick={() => setActiveWeek(week.weekNumber)}
                        className={`curriculum-week-tab${
                          activeWeek === week.weekNumber ? ' curriculum-week-tab--active' : ''
                        }`}
                      >
                        <span>Week {week.weekNumber}</span>
                        {hasChanges && (
                          <span
                            className="inline-block"
                            style={{
                              marginLeft: 'var(--space-sm)',
                              width: '8px',
                              height: '8px',
                              backgroundColor: 'var(--color-warning)',
                              borderRadius: 'var(--radius-pill)'
                            }}
                            title="Modified from batch plan"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active Week Content */}
                {weeks.map(
                  (week) =>
                    activeWeek === week.weekNumber && (
                      <div key={week.weekNumber} className="curriculum-week-content">
                        {/* Diff Badge */}
                        {hasWeekChanged(week.weekNumber) && (
                          <div className="alert-base alert-warning">
                            <svg
                              className="alert-base__icon"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                            </svg>
                            <div className="alert-base__content">
                              <p className="alert-base__title">
                                Modified from Batch Plan
                              </p>
                              <p className="alert-base__message">
                                {getWeekChanges(week.weekNumber).join(', ')}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Focus Area */}
                        <div className="form-group-stack">
                          <label className="text-label">
                            Focus Area
                          </label>
                          <input
                            type="text"
                            value={week.focusArea}
                            onChange={(e) =>
                              handleWeekUpdate(week.weekNumber, 'focusArea', e.target.value)
                            }
                            placeholder="e.g., Foundation - Grip and Basic Footwork"
                            disabled={isArchived}
                            className="input"
                          />
                        </div>

                        {/* Drills Drop Zone */}
                        <div className="form-group-stack">
                          <label className="text-label">
                            Assigned Drills
                          </label>
                          <div
                            className={`curriculum-drop-zone${
                              isArchived ? ' curriculum-drop-zone--archived' : ''
                            }`}
                            onDragOver={(e) => {
                              if (!isArchived) e.preventDefault();
                            }}
                            onDrop={(e) => {
                              if (isArchived) return;
                              e.preventDefault();
                              const drillData = e.dataTransfer.getData('drill');
                              if (drillData) {
                                const drill: Drill = JSON.parse(drillData);
                                handleDrillDrop(week.weekNumber, drill);
                              }
                            }}
                          >
                            {week.drills.length === 0 ? (
                              <p className="curriculum-drop-zone__empty text-small">
                                {isArchived
                                  ? 'No drills assigned for this week'
                                  : 'Drag and drop drills here from the library'}
                              </p>
                            ) : (
                              <div className="curriculum-drill-list">
                                {week.drills.map((drill) => (
                                  <div
                                    key={drill.id}
                                    className="curriculum-drill-item"
                                  >
                                    <div className="curriculum-drill-item__info">
                                      <span className="text-body" style={{ fontWeight: 'var(--weight-semibold)' }}>
                                        {drill.name}
                                      </span>
                                      <span className="text-small" style={{ marginTop: '2px' }}>
                                        {drill.description}
                                      </span>
                                      <span className="badge badge-secondary" style={{ marginTop: '4px' }}>
                                        {drill.category}
                                      </span>
                                    </div>
                                    {!isArchived && (
                                      <button
                                        onClick={() => handleRemoveDrill(week.weekNumber, drill.id)}
                                        className="curriculum-drill-item__remove"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Objective */}
                        <div className="form-group-stack">
                          <label className="text-label">
                            Weekly Objective
                          </label>
                          <textarea
                            value={week.objective}
                            onChange={(e) =>
                              handleWeekUpdate(week.weekNumber, 'objective', e.target.value)
                            }
                            placeholder="e.g., Establish proper grip habits and develop basic court coverage skills"
                            rows={3}
                            disabled={isArchived}
                            className="input"
                            style={{ height: 'auto', resize: 'vertical' }}
                          />
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default IndividualCurriculumPage;

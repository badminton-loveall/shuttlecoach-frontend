import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import DrillLibrary from '../components/DrillLibrary';
import { useAuth } from '../contexts/AuthContext';
import { generateCycleKey, isCycleArchived, getAllCyclesFromPlans } from '../utils/skillUtils';
import type { CurriculumPlan, WeekPlan, Drill, Student } from '../types';
import curriculumData from '../data/curriculum.json';
import studentsData from '../data/students.json';

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
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-600 dark:text-slate-400">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-12">
          <button
            onClick={() => navigate('/students')}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-4 flex items-center gap-2 text-sm"
          >
            <span>←</span> Back to Students
          </button>
          <h1 className="text-[36px] font-bold text-slate-900 dark:text-slate-50 mb-2 leading-tight">
            Individual Curriculum - {student.fullName}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Edit curriculum plan for this student
          </p>
        </div>

        {/* Warning Banner - Shows if plan was copied from batch */}
        {batchPlan && !isArchived && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                  Individual Plan (Copied from Batch)
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                  This plan was originally copied from a batch curriculum. Changes you make here
                  will only affect <strong>{student.fullName}</strong> and will not impact the
                  batch plan or other students. Modified weeks are highlighted with a yellow badge.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Archived Plan Warning */}
        {isArchived && (
          <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-200">
                  Archived Plan (Read-Only)
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                  This curriculum plan is from a past cycle and cannot be edited. It is preserved
                  for historical reference only.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls Section */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 mb-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cycle Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Bi-monthly Cycle
              </label>
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {availableCycles.map((cycle) => (
                  <option key={cycle} value={cycle}>
                    {cycle} {isCycleArchived(cycle) ? '(Archived)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Info */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Student
              </label>
              <div className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100">
                {student.fullName}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-end">
              <button
                onClick={handleSavePlan}
                disabled={isSaving || isArchived}
                className="w-full px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-slate-900 dark:text-slate-900 font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Individual Plan'}
              </button>
            </div>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                saveMessage.includes('Error') || saveMessage.includes('Cannot')
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              }`}
            >
              {saveMessage}
            </div>
          )}
        </div>

        {/* Main Content: Drill Library + Week Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Drill Library (Left Side) */}
          <div className="lg:col-span-1">
            <DrillLibrary />
          </div>

          {/* 8-Week Editor (Right Side) */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
              {/* Week Tabs */}
              <div className="border-b border-slate-200 dark:border-slate-800">
                <div className="flex overflow-x-auto">
                  {weeks.map((week) => {
                    const hasChanges = hasWeekChanged(week.weekNumber);
                    return (
                      <button
                        key={week.weekNumber}
                        onClick={() => setActiveWeek(week.weekNumber)}
                        className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                          activeWeek === week.weekNumber
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <span>Week {week.weekNumber}</span>
                        {hasChanges && (
                          <span className="ml-2 inline-block w-2 h-2 bg-yellow-500 rounded-full" title="Modified from batch plan" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Week Content */}
              {weeks.map(
                (week) =>
                  activeWeek === week.weekNumber && (
                    <div key={week.weekNumber} className="p-6 space-y-6">
                      {/* Diff Badge */}
                      {hasWeekChanged(week.weekNumber) && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <svg
                              className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                                Modified from Batch Plan
                              </p>
                              <p className="text-xs text-yellow-800 dark:text-yellow-300 mt-1">
                                {getWeekChanges(week.weekNumber).join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Focus Area */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Drills Drop Zone */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Assigned Drills
                        </label>
                        <div
                          className={`min-h-[150px] border-2 border-dashed rounded-lg p-4 ${
                            isArchived
                              ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/30'
                              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
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
                            <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                              {isArchived
                                ? 'No drills assigned for this week'
                                : 'Drag and drop drills here from the library'}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {week.drills.map((drill) => (
                                <div
                                  key={drill.id}
                                  className="flex items-start justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
                                >
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                      {drill.name}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                      {drill.description}
                                    </p>
                                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                                      {drill.category}
                                    </span>
                                  </div>
                                  {!isArchived && (
                                    <button
                                      onClick={() => handleRemoveDrill(week.weekNumber, drill.id)}
                                      className="ml-4 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
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
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IndividualCurriculumPage;

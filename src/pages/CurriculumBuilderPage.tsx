import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DrillLibrary from '../components/DrillLibrary';
import { generateCycleKey, isCycleArchived, getAllCyclesFromPlans } from '../utils/skillUtils';
import type { CurriculumPlan, WeekPlan, Drill } from '../types';
import curriculumData from '../data/curriculum.json';
import studentsData from '../data/students.json';

/**
 * CurriculumBuilderPage
 * Manages curriculum planning for batches with 8-week editor
 * Includes bi-monthly cycle selector, weekly planner, and drill library
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6
 */

interface BatchOption {
  id: string;
  name: string;
}

const CurriculumBuilderPage: React.FC = () => {
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [weeks, setWeeks] = useState<WeekPlan[]>([]);
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [availableCycles, setAvailableCycles] = useState<string[]>([]);
  const [isArchived, setIsArchived] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Initialize current cycle, batches, and available cycles
  useEffect(() => {
    const currentCycle = generateCycleKey();
    setSelectedCycle(currentCycle);

    // Extract unique batches from students
    const uniqueBatches = Array.from(
      new Set(
        studentsData
          .filter((s) => s.batchId)
          .map((s) => s.batchId)
      )
    ).map((batchId) => ({
      id: batchId!,
      name: `Batch ${batchId!.split('-')[1]}`
    }));

    setBatches(uniqueBatches);

    // Get all available cycles from curriculum plans
    const storedPlans = localStorage.getItem('curriculumPlans');
    const plansData = storedPlans ? JSON.parse(storedPlans) : curriculumData;
    const cycles = getAllCyclesFromPlans(plansData);
    setAvailableCycles(cycles);

    // Initialize empty weeks
    const emptyWeeks: WeekPlan[] = Array.from({ length: 8 }, (_, i) => ({
      weekNumber: (i + 1) as WeekPlan['weekNumber'],
      focusArea: '',
      drills: [],
      objective: ''
    }));

    setWeeks(emptyWeeks);
  }, []);

  // Load existing curriculum when batch and cycle are selected
  useEffect(() => {
    if (selectedBatch && selectedCycle) {
      // Check if cycle is archived
      const archived = isCycleArchived(selectedCycle);
      setIsArchived(archived);

      // Try to load from localStorage first
      const storedPlans = localStorage.getItem('curriculumPlans');
      let plansToSearch = curriculumData as any[];
      
      if (storedPlans) {
        try {
          plansToSearch = JSON.parse(storedPlans);
        } catch (e) {
          console.error('Error parsing curriculum plans from localStorage:', e);
        }
      }

      const existingPlan = plansToSearch.find(
        (plan: any) => plan.batchId === selectedBatch && plan.cycleKey === selectedCycle
      );

      if (existingPlan) {
        setWeeks(existingPlan.weeks as WeekPlan[]);
      } else {
        // Reset to empty weeks
        const emptyWeeks: WeekPlan[] = Array.from({ length: 8 }, (_, i) => ({
          weekNumber: (i + 1) as WeekPlan['weekNumber'],
          focusArea: '',
          drills: [],
          objective: ''
        }));
        setWeeks(emptyWeeks);
      }
    }
  }, [selectedBatch, selectedCycle]);

  const handleWeekUpdate = (weekNumber: number, field: keyof WeekPlan, value: string) => {
    if (isArchived) {
      setSaveMessage('Cannot edit archived curriculum plans from past cycles');
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
      setSaveMessage('Cannot edit archived curriculum plans from past cycles');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setWeeks((prevWeeks) =>
      prevWeeks.map((week) => {
        if (week.weekNumber === weekNumber) {
          // Check if drill already exists in this week
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
      setSaveMessage('Cannot edit archived curriculum plans from past cycles');
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

  const handleSaveBatchPlan = async () => {
    if (isArchived) {
      setSaveMessage('Cannot save archived curriculum plans from past cycles');
      return;
    }

    if (!selectedBatch) {
      setSaveMessage('Please select a batch first');
      return;
    }

    // Validate that at least some weeks have content
    const hasContent = weeks.some(
      (week) => week.focusArea || week.drills.length > 0 || week.objective
    );

    if (!hasContent) {
      setSaveMessage('Please add content to at least one week');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const timestamp = Date.now();
      const batchPlanId = `curriculum-${timestamp}`;
      
      // Create batch-level curriculum plan
      const batchPlan: CurriculumPlan = {
        id: batchPlanId,
        cycleKey: selectedCycle,
        batchId: selectedBatch,
        studentId: undefined,
        sourceBatchPlanId: undefined,
        weeks: weeks,
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchived: isCycleArchived(selectedCycle)
      };

      // Get all students in this batch
      const batchStudents = studentsData.filter((student) => student.batchId === selectedBatch);

      // Create individual plans for each student in the batch
      const individualPlans: CurriculumPlan[] = batchStudents.map((student, index) => ({
        id: `curriculum-${timestamp}-student-${index}`,
        cycleKey: selectedCycle,
        batchId: undefined,
        studentId: student.id,
        sourceBatchPlanId: batchPlanId,
        weeks: JSON.parse(JSON.stringify(weeks)), // Deep copy of weeks array
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchived: isCycleArchived(selectedCycle)
      }));

      // Load existing curriculum plans from localStorage
      const existingPlans = JSON.parse(localStorage.getItem('curriculumPlans') || '[]');

      // Remove any existing plans for this batch and cycle
      const filteredPlans = existingPlans.filter(
        (plan: CurriculumPlan) => 
          !(plan.batchId === selectedBatch && plan.cycleKey === selectedCycle) &&
          !(plan.sourceBatchPlanId === batchPlanId || 
            (batchStudents.some(s => s.id === plan.studentId) && 
             plan.cycleKey === selectedCycle && 
             plan.sourceBatchPlanId))
      );

      // Add new batch plan and individual plans
      const updatedPlans = [...filteredPlans, batchPlan, ...individualPlans];

      // Save to localStorage
      localStorage.setItem('curriculumPlans', JSON.stringify(updatedPlans));

      console.log('Batch plan saved:', batchPlan);
      console.log('Individual plans created:', individualPlans);

      setSaveMessage(
        `Batch plan saved successfully! Created ${individualPlans.length} individual plan(s) for students in ${batches.find(b => b.id === selectedBatch)?.name}.`
      );
      setTimeout(() => setSaveMessage(''), 5000);
    } catch (error) {
      setSaveMessage('Error saving batch plan. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Curriculum Builder</h1>
              <p className="page-header-subtitle">Create and manage 8-week training curriculum for batches</p>
            </div>
          </div>

          {/* Controls Section */}
          <div className="table-filter-section">
            {/* Archived Banner */}
            {isArchived && (
              <div className="mb-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-4">
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
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                      This curriculum plan is from a past cycle and cannot be edited. It is preserved
                      for historical reference only.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
              {/* Cycle Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                  Bi-monthly Cycle
                </label>
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="filter-dropdown w-full"
                >
                  {availableCycles.map((cycle) => (
                    <option key={cycle} value={cycle}>
                      {cycle} {isCycleArchived(cycle) ? '(Archived)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                  Select Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="filter-dropdown w-full"
                >
                  <option value="">-- Choose Batch --</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Button */}
              <div className="flex items-end">
                <button
                  onClick={handleSaveBatchPlan}
                  disabled={isSaving || !selectedBatch || isArchived}
                  className="btn-create-fee w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Batch Plan'}
                </button>
              </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div
                className={`mx-6 mb-6 p-3 rounded-lg text-xs ${
                  saveMessage.includes('Error')
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                }`}
              >
                {saveMessage}
              </div>
            )}
          </div>

          {/* Main Content: Drill Library + Week Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Drill Library (Left Side) */}
            <div className="lg:col-span-1 mb-8 lg:mb-0">
              <DrillLibrary />
            </div>

            {/* 8-Week Editor (Right Side) */}
            <div className="lg:col-span-2">
              <div className="table-filter-section">
                {/* Week Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-800">
                  <div className="flex overflow-x-auto">
                    {weeks.map((week) => (
                      <button
                        key={week.weekNumber}
                        onClick={() => setActiveWeek(week.weekNumber)}
                        className={`px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                          activeWeek === week.weekNumber
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Week {week.weekNumber}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Week Content */}
                {weeks.map(
                  (week) =>
                    activeWeek === week.weekNumber && (
                      <div key={week.weekNumber} className="p-6 space-y-4">
                        {/* Focus Area */}
                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
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
                            className="filter-dropdown w-full"
                          />
                        </div>

                        {/* Drills Drop Zone */}
                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
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
                              <div className="text-center text-slate-500 dark:text-slate-400 py-8 text-xs">
                                {isArchived
                                  ? 'No drills assigned for this week'
                                  : 'Drag and drop drills here from the library'}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {week.drills.map((drill) => (
                                  <div
                                    key={drill.id}
                                    className="flex items-start justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
                                  >
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                        {drill.name}
                                      </h4>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                        {drill.description}
                                      </p>
                                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                                        {drill.category}
                                      </span>
                                    </div>
                                    {!isArchived && (
                                      <button
                                        onClick={() => handleRemoveDrill(week.weekNumber, drill.id)}
                                        className="ml-4 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium"
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
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
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
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

export default CurriculumBuilderPage;

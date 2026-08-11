import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DrillLibrary from '../components/DrillLibrary';
import { generateCycleKey, isCycleArchived, getAllCyclesFromPlans } from '../utils/skillUtils';
import { useBatches } from '../hooks/useBatches';
import { useCurriculum } from '../hooks/useCurriculum';
import type { WeekPlan, Drill } from '../types';
import '../styles/pages.css';

/**
 * CurriculumBuilderPage
 * Requirements: 18.1–18.6
 *
 * Creates and manages 8-week batch curriculum plans via the API backend.
 * After saving a batch plan, clones individual plans for all students in the batch server-side.
 */

const CurriculumBuilderPage: React.FC = () => {
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [weeks, setWeeks] = useState<WeekPlan[]>([]);
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [availableCycles, setAvailableCycles] = useState<string[]>([]);
  const [isArchived, setIsArchived] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  const { batches, loading: batchesLoading } = useBatches();

  // Fetch curriculum plans from API, filtered by batchId and cycleKey
  const {
    plans,
    loading: curriculumLoading,
    error: curriculumError,
    createPlan,
    cloneBatchPlan,
    refetch: refetchPlans,
  } = useCurriculum({
    batchId: selectedBatch || undefined,
    cycleKey: selectedCycle || undefined,
  });

  // Initialize cycle on mount
  useEffect(() => {
    const currentCycle = generateCycleKey();
    setSelectedCycle(currentCycle);

    setWeeks(Array.from({ length: 8 }, (_, i) => ({
      weekNumber: (i + 1) as WeekPlan['weekNumber'],
      focusArea: '', drills: [], objective: ''
    })));
  }, []);

  // Update available cycles from API plans data
  useEffect(() => {
    if (curriculumLoading) return;
    setAvailableCycles(getAllCyclesFromPlans(plans));
  }, [plans, curriculumLoading]);

  // Load existing batch plan when batch/cycle changes
  useEffect(() => {
    if (selectedBatch && selectedCycle) {
      setIsArchived(isCycleArchived(selectedCycle));

      if (curriculumLoading) return;

      // Find existing batch plan from API-fetched plans
      const existingPlan = plans.find(
        (p) => p.batchId === selectedBatch && p.cycleKey === selectedCycle
      );

      setWeeks(existingPlan
        ? (existingPlan.weeks as WeekPlan[])
        : Array.from({ length: 8 }, (_, i) => ({
            weekNumber: (i + 1) as WeekPlan['weekNumber'],
            focusArea: '', drills: [], objective: ''
          }))
      );
    }
  }, [selectedBatch, selectedCycle, plans, curriculumLoading]);

  const handleWeekUpdate = (weekNumber: number, field: keyof WeekPlan, value: string) => {
    if (isArchived) { setSaveMessage('Cannot edit archived plans'); setTimeout(() => setSaveMessage(''), 3000); return; }
    setWeeks((prev) => prev.map((w) => w.weekNumber === weekNumber ? { ...w, [field]: value } : w));
  };

  const handleDrillDrop = (weekNumber: number, drill: Drill) => {
    if (isArchived) { setSaveMessage('Cannot edit archived plans'); setTimeout(() => setSaveMessage(''), 3000); return; }
    setWeeks((prev) => prev.map((w) => {
      if (w.weekNumber === weekNumber && !w.drills.some((d) => d.id === drill.id)) {
        return { ...w, drills: [...w.drills, drill] };
      }
      return w;
    }));
  };

  const handleRemoveDrill = (weekNumber: number, drillId: string) => {
    if (isArchived) { setSaveMessage('Cannot edit archived plans'); setTimeout(() => setSaveMessage(''), 3000); return; }
    setWeeks((prev) => prev.map((w) =>
      w.weekNumber === weekNumber ? { ...w, drills: w.drills.filter((d) => d.id !== drillId) } : w
    ));
  };

  const handleSaveBatchPlan = async () => {
    if (isArchived) { setSaveMessage('Cannot save archived plans'); return; }
    if (!selectedBatch) { setSaveMessage('Please select a batch first'); return; }
    if (!weeks.some((w) => w.focusArea || w.drills.length > 0 || w.objective)) {
      setSaveMessage('Please add content to at least one week'); return;
    }

    setIsSaving(true);
    setSaveMessage('');
    try {
      // Persist batch plan via API
      const batchPlan = await createPlan({
        cycleKey: selectedCycle,
        batchId: selectedBatch,
        weeks,
      });

      // Clone batch plan to generate individual student plans server-side
      const clonedPlans = await cloneBatchPlan(batchPlan.id, { batchId: selectedBatch });

      // Refresh plans list after save
      await refetchPlans();

      setSaveMessage(`Saved! Created ${clonedPlans.length} individual plan(s) for ${batches.find(b => b.id === selectedBatch)?.name}.`);
      setTimeout(() => setSaveMessage(''), 5000);
    } catch {
      setSaveMessage('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (curriculumLoading && selectedBatch) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="section-stack">
            <div className="page-header">
              <div>
                <h1 className="page-header-title">Curriculum Builder</h1>
                <p className="page-header-subtitle">Loading curriculum data...</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (curriculumError && selectedBatch) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="section-stack">
            <div className="page-header">
              <div>
                <h1 className="page-header-title">Curriculum Builder</h1>
                <p className="page-header-subtitle">Create and manage 8-week training curriculum for batches</p>
              </div>
            </div>
            <div className="card">
              <div className="alert-base alert-warning">
                <span className="alert-title">Error</span>
                <span className="alert-message"> — {curriculumError}</span>
              </div>
              <button
                onClick={() => refetchPlans()}
                className="btn btn-secondary"
                style={{ marginTop: 'var(--space-md)' }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">

          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Curriculum Builder</h1>
              <p className="page-header-subtitle">Create and manage 8-week training curriculum for batches</p>
            </div>
          </div>

          {/* Controls */}
          <div className="card">
            {isArchived && (
              <div className="alert-base alert-warning" style={{ marginBottom: 'var(--space-md)' }}>
                <span className="alert-title">Archived Plan (Read-Only)</span>
                <span className="alert-message"> — This plan is from a past cycle and cannot be edited.</span>
              </div>
            )}

            <div className="curriculum-controls">
              <div className="form-group-inline">
                <label className="text-label">Bi-monthly Cycle</label>
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="input"
                >
                  {availableCycles.map((cycle) => (
                    <option key={cycle} value={cycle}>
                      {cycle}{isCycleArchived(cycle) ? ' (Archived)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-inline">
                <label className="text-label">Select Batch</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="input"
                  disabled={batchesLoading}
                >
                  <option value="">{batchesLoading ? 'Loading batches...' : 'Choose batch...'}</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-inline form-group-inline--action">
                <button
                  onClick={handleSaveBatchPlan}
                  disabled={isSaving || !selectedBatch || isArchived}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {isSaving ? 'Saving...' : 'Save Batch Plan'}
                </button>
              </div>
            </div>

            {saveMessage && (
              <div
                className={saveMessage.includes('Error') || saveMessage.includes('Cannot') || saveMessage.includes('Please')
                  ? 'alert-base alert-warning'
                  : 'alert-base alert-success'}
                style={{ marginTop: 'var(--space-md)' }}
              >
                {saveMessage}
              </div>
            )}
          </div>

          {/* Main: Drill Library + Week Editor */}
          <div className="curriculum-layout">
            {/* Drill Library */}
            <div className="curriculum-library">
              <DrillLibrary />
            </div>

            {/* Week Editor */}
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
                    </button>
                  ))}
                </div>

                {/* Active Week */}
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
                          disabled={isArchived}
                          className="input"
                        />
                      </div>

                      {/* Drills Drop Zone */}
                      <div className="form-group-stack">
                        <label className="text-label">Assigned Drills</label>
                        <div
                          className={`curriculum-drop-zone${isArchived ? ' curriculum-drop-zone--archived' : ''}`}
                          onDragOver={(e) => { if (!isArchived) e.preventDefault(); }}
                          onDrop={(e) => {
                            if (isArchived) return;
                            e.preventDefault();
                            const drillData = e.dataTransfer.getData('drill');
                            if (drillData) handleDrillDrop(week.weekNumber, JSON.parse(drillData));
                          }}
                        >
                          {week.drills.length === 0 ? (
                            <p className="curriculum-drop-zone__empty text-small">
                              {isArchived ? 'No drills assigned for this week' : 'Drag drills here from the library'}
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
                                  {!isArchived && (
                                    <button
                                      onClick={() => handleRemoveDrill(week.weekNumber, drill.id)}
                                      className="curriculum-drill-item__remove"
                                      aria-label={`Remove ${drill.name}`}
                                    >
                                      ✕
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
                        <label className="text-label">Weekly Objective</label>
                        <textarea
                          value={week.objective}
                          onChange={(e) => handleWeekUpdate(week.weekNumber, 'objective', e.target.value)}
                          placeholder="e.g., Establish proper grip habits and develop basic court coverage skills"
                          rows={2}
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

export default CurriculumBuilderPage;

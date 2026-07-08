import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DrillLibrary from '../components/DrillLibrary';
import { generateCycleKey, isCycleArchived, getAllCyclesFromPlans } from '../utils/skillUtils';
import type { CurriculumPlan, WeekPlan, Drill } from '../types';
import curriculumData from '../data/curriculum.json';
import studentsData from '../data/students.json';
import '../styles/pages.css';

/**
 * CurriculumBuilderPage
 * Requirements: 18.1–18.6
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

  useEffect(() => {
    const currentCycle = generateCycleKey();
    setSelectedCycle(currentCycle);

    const uniqueBatches = Array.from(
      new Set(studentsData.filter((s) => s.batchId).map((s) => s.batchId))
    ).map((batchId) => ({ id: batchId!, name: `Batch ${batchId!.split('-')[1]}` }));
    setBatches(uniqueBatches);

    const storedPlans = localStorage.getItem('curriculumPlans');
    const plansData = storedPlans ? JSON.parse(storedPlans) : curriculumData;
    setAvailableCycles(getAllCyclesFromPlans(plansData));

    setWeeks(Array.from({ length: 8 }, (_, i) => ({
      weekNumber: (i + 1) as WeekPlan['weekNumber'],
      focusArea: '', drills: [], objective: ''
    })));
  }, []);

  useEffect(() => {
    if (selectedBatch && selectedCycle) {
      setIsArchived(isCycleArchived(selectedCycle));

      const storedPlans = localStorage.getItem('curriculumPlans');
      let plansToSearch = curriculumData as any[];
      if (storedPlans) {
        try { plansToSearch = JSON.parse(storedPlans); } catch (e) { /* ignore */ }
      }

      const existingPlan = plansToSearch.find(
        (p: any) => p.batchId === selectedBatch && p.cycleKey === selectedCycle
      );

      setWeeks(existingPlan
        ? (existingPlan.weeks as WeekPlan[])
        : Array.from({ length: 8 }, (_, i) => ({
            weekNumber: (i + 1) as WeekPlan['weekNumber'],
            focusArea: '', drills: [], objective: ''
          }))
      );
    }
  }, [selectedBatch, selectedCycle]);

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
      const timestamp = Date.now();
      const batchPlanId = `curriculum-${timestamp}`;
      const batchPlan: CurriculumPlan = {
        id: batchPlanId, cycleKey: selectedCycle, batchId: selectedBatch,
        studentId: undefined, sourceBatchPlanId: undefined, weeks,
        createdAt: new Date(), updatedAt: new Date(), isArchived: isCycleArchived(selectedCycle)
      };
      const batchStudents = studentsData.filter((s) => s.batchId === selectedBatch);
      const individualPlans: CurriculumPlan[] = batchStudents.map((student, i) => ({
        id: `curriculum-${timestamp}-student-${i}`, cycleKey: selectedCycle, batchId: undefined,
        studentId: student.id, sourceBatchPlanId: batchPlanId,
        weeks: JSON.parse(JSON.stringify(weeks)),
        createdAt: new Date(), updatedAt: new Date(), isArchived: isCycleArchived(selectedCycle)
      }));

      const existingPlans = JSON.parse(localStorage.getItem('curriculumPlans') || '[]');
      const filteredPlans = existingPlans.filter((p: CurriculumPlan) =>
        !(p.batchId === selectedBatch && p.cycleKey === selectedCycle) &&
        !(p.sourceBatchPlanId === batchPlanId ||
          (batchStudents.some(s => s.id === p.studentId) && p.cycleKey === selectedCycle && p.sourceBatchPlanId))
      );
      localStorage.setItem('curriculumPlans', JSON.stringify([...filteredPlans, batchPlan, ...individualPlans]));

      setSaveMessage(`Saved! Created ${individualPlans.length} individual plan(s) for ${batches.find(b => b.id === selectedBatch)?.name}.`);
      setTimeout(() => setSaveMessage(''), 5000);
    } catch {
      setSaveMessage('Error saving. Please try again.');
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
                >
                  <option value="">Choose batch...</option>
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

import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { ScheduleBuilder } from '../components/ScheduleBuilder';
import { useBatches } from '../hooks/useBatches';
import { useSessionSchedule, useCreateSessionSchedule } from '../hooks/useSessionSchedule';
import { useToast } from '../contexts/ToastContext';
import type { SessionSlot, RecurrencePattern } from '../types';
import '../styles/pages.css';

/**
 * BatchSchedulePage
 * Settings page for configuring training days and times per batch.
 * HEAD_COACH only.
 */
const BatchSchedulePage: React.FC = () => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  const { batches, loading: batchesLoading, error: batchesError } = useBatches();
  const { schedule, loading: scheduleLoading, error: scheduleError, refetch } = useSessionSchedule(selectedBatchId || undefined);
  const { createSchedule, loading: saving } = useCreateSessionSchedule();
  const { showToast } = useToast();

  const handleSave = async (slots: SessionSlot[], recurrence: RecurrencePattern) => {
    if (!selectedBatchId) return;
    try {
      await createSchedule({ batchId: selectedBatchId, slots, recurrence });
      showToast({ message: 'Schedule saved successfully', type: 'success' });
      refetch();
    } catch {
      showToast({ message: 'Failed to save schedule. Please try again.', type: 'error' });
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">

          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Session Schedule</h1>
              <p className="page-header-subtitle">Configure training days and times for each batch</p>
            </div>
          </div>

          {/* Batch Selector */}
          <div className="card">
            <div className="form-group-inline">
              <label className="text-label">Select Batch</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="input"
                disabled={batchesLoading}
              >
                <option value="">{batchesLoading ? 'Loading batches...' : 'Choose batch...'}</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                ))}
              </select>
            </div>

            {batchesError && (
              <p className="alert-base alert-warning" style={{ marginTop: 'var(--space-md)' }}>
                {batchesError}
              </p>
            )}
          </div>

          {/* Schedule Builder Area */}
          {selectedBatchId && (
            <div className="card">
              {scheduleLoading && (
                <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
                  Loading schedule...
                </p>
              )}

              {scheduleError && (
                <p className="alert-base alert-warning">
                  {scheduleError}
                </p>
              )}

              {!scheduleLoading && !scheduleError && (
                <ScheduleBuilder
                  key={selectedBatchId}
                  initialSlots={schedule?.slots ?? []}
                  initialRecurrence={schedule?.recurrence}
                  onSave={handleSave}
                  readOnly={false}
                  isSaving={saving}
                />
              )}
            </div>
          )}

          {/* Prompt when no batch selected */}
          {!selectedBatchId && !batchesError && (
            <div className="card">
              <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
                Select a batch above to view or configure its session schedule.
              </p>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
};

export default BatchSchedulePage;

/**
 * TrainingAnalyticsPage
 * Main analytics page integrating all training analytics components with
 * cycle/batch/student selectors and a date range picker with auto-refresh.
 *
 * Uses DashboardLayout wrapper. Integrates:
 * - DrillCompletionChart (per-week drill completion rates)
 * - SkillTrendChart (attendance vs skill dual-axis chart)
 * - BatchComparisonTable (sortable batch/student comparison)
 * - TrainingPatternHeatmap (attendance heatmap + category distribution)
 *
 * Requirements: 6.1, 7.4, 8.1, 9.1, 10.4, 13.3
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { DrillCompletionChart } from '../components/DrillCompletionChart';
import { SkillTrendChart } from '../components/SkillTrendChart';
import { BatchComparisonTable } from '../components/BatchComparisonTable';
import { TrainingPatternHeatmap } from '../components/TrainingPatternHeatmap';
import {
  useDrillCompletion,
  useBatchComparison,
  useStudentComparison,
  useStudentTrends,
  useTrainingPatterns,
} from '../hooks/useAnalytics';
import { useStudents } from '../hooks/useStudents';
import type { Batch } from '../types';
import apiClient from '../utils/apiClient';

type AnalyticsTab = 'drills' | 'comparison' | 'trends' | 'patterns';

/**
 * Compute a default date range: last 3 months.
 */
function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

const TrainingAnalyticsPage: React.FC = () => {
  // ─── State: Selectors ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('drills');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [cycleKey, setCycleKey] = useState<string>('');

  // Date range state for patterns
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [startDate, setStartDate] = useState<string>(defaultRange.startDate);
  const [endDate, setEndDate] = useState<string>(defaultRange.endDate);

  // Auto-refresh timer ref (requirement 10.4: within 3 seconds)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch Batches ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadBatches = async () => {
      try {
        const response = await apiClient.get('/batches');
        const batchData = response.data.batches || response.data;
        setBatches(Array.isArray(batchData) ? batchData : []);
      } catch {
        setBatches([]);
      }
    };
    void loadBatches();
  }, []);

  // ─── Fetch Students (for student selector) ────────────────────────────────
  const studentFilters = useMemo(
    () => (selectedBatchId ? { batch: selectedBatchId } : undefined),
    [selectedBatchId]
  );
  const { students } = useStudents(studentFilters);

  // ─── Analytics Hooks ───────────────────────────────────────────────────────
  const drillCompletion = useDrillCompletion({
    cycleKey,
    batchId: selectedBatchId || undefined,
  });

  const batchComparison = useBatchComparison({
    cycleKey: cycleKey || undefined,
  });

  const studentComparison = useStudentComparison({
    batchId: selectedBatchId,
    cycleKey: cycleKey || undefined,
  });

  const studentTrends = useStudentTrends({
    studentId: selectedStudentId,
  });

  const trainingPatterns = useTrainingPatterns({
    batchId: selectedBatchId || undefined,
    startDate,
    endDate,
  });

  // ─── Auto-Refresh on Date Range Change (within 3 seconds) ─────────────────
  const handleDateRangeChange = useCallback(
    (field: 'startDate' | 'endDate', value: string) => {
      if (field === 'startDate') setStartDate(value);
      else setEndDate(value);

      // Clear existing timer
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      // Set new timer to refresh within 3 seconds
      refreshTimerRef.current = setTimeout(() => {
        trainingPatterns.refetch();
      }, 2000);
    },
    [trainingPatterns]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  // ─── Tab Configuration ─────────────────────────────────────────────────────
  const tabs: { id: AnalyticsTab; label: string }[] = [
    { id: 'drills', label: 'Drill Completion' },
    { id: 'comparison', label: 'Batch Comparison' },
    { id: 'trends', label: 'Skill Trends' },
    { id: 'patterns', label: 'Training Patterns' },
  ];

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Training Analytics</h1>
              <p className="page-header-subtitle">
                Analyze drill completion, skill trends, batch comparisons, and training patterns
              </p>
            </div>
          </div>

          {/* Selectors Row */}
          <div
            style={{
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-md)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              {/* Cycle Key Input */}
              <div className="flex-1">
                <label
                  htmlFor="analytics-cycle-key"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cycle
                </label>
                <input
                  id="analytics-cycle-key"
                  type="text"
                  placeholder="e.g., Jan-Feb 2025"
                  value={cycleKey}
                  onChange={(e) => setCycleKey(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Batch Selector */}
              <div className="flex-1">
                <label
                  htmlFor="analytics-batch"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Batch
                </label>
                <select
                  id="analytics-batch"
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    setSelectedStudentId('');
                  }}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">All Batches</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Selector (for trends tab) */}
              <div className="flex-1">
                <label
                  htmlFor="analytics-student"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Student
                </label>
                <select
                  id="analytics-student"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={!selectedBatchId && students.length === 0}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range (for patterns) */}
              {activeTab === 'patterns' && (
                <>
                  <div className="flex-1">
                    <label
                      htmlFor="analytics-start-date"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      From
                    </label>
                    <input
                      id="analytics-start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{
                        backgroundColor: 'var(--surface-card)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="analytics-end-date"
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      To
                    </label>
                    <input
                      id="analytics-end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{
                        backgroundColor: 'var(--surface-card)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="sp-tab-nav overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`sp-tab${activeTab === tab.id ? ' sp-tab--active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex flex-col gap-6">
            {/* Drill Completion Tab */}
            {activeTab === 'drills' && (
              <div>
                {!cycleKey ? (
                  <div
                    className="text-center"
                    style={{
                      backgroundColor: 'var(--surface-card)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-lg)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <svg
                      className="mx-auto h-10 w-10 mb-3"
                      style={{ color: 'var(--text-tertiary)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Enter a cycle key (e.g., "Jan-Feb 2025") to view drill completion data.
                    </p>
                  </div>
                ) : (
                  <DrillCompletionChart
                    data={drillCompletion.data}
                    loading={drillCompletion.loading}
                    error={drillCompletion.error}
                  />
                )}
              </div>
            )}

            {/* Batch Comparison Tab */}
            {activeTab === 'comparison' && (
              <div className="flex flex-col gap-6">
                {/* Batch-level comparison */}
                <BatchComparisonTable
                  data={batchComparison.data}
                  loading={batchComparison.loading}
                  error={batchComparison.error}
                  title="Batch Comparison"
                  nameColumnLabel="Batch"
                />

                {/* Student-level comparison within selected batch */}
                {selectedBatchId && (
                  <BatchComparisonTable
                    data={studentComparison.data}
                    loading={studentComparison.loading}
                    error={studentComparison.error}
                    title="Student Comparison"
                    nameColumnLabel="Student"
                  />
                )}

                {!selectedBatchId && (
                  <div
                    style={{
                      backgroundColor: 'var(--surface-card)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-lg)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Select a batch above to view student-level comparison within that batch.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Skill Trends Tab */}
            {activeTab === 'trends' && (
              <div>
                {!selectedStudentId ? (
                  <div
                    className="text-center"
                    style={{
                      backgroundColor: 'var(--surface-card)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-lg)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <svg
                      className="mx-auto h-10 w-10 mb-3"
                      style={{ color: 'var(--text-tertiary)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      Select a batch and student to view their attendance vs skill improvement trends.
                    </p>
                  </div>
                ) : (
                  <SkillTrendChart report={studentTrends.data} />
                )}
              </div>
            )}

            {/* Training Patterns Tab */}
            {activeTab === 'patterns' && (
              <TrainingPatternHeatmap
                data={trainingPatterns.data}
                loading={trainingPatterns.loading}
                error={trainingPatterns.error}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TrainingAnalyticsPage;

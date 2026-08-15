import React, { useState, useEffect, useCallback } from 'react';
import { useWizard } from './WizardContext';
import apiClient from '../../utils/apiClient';
import './ScheduleStep.css';

/**
 * ScheduleStep Component
 * Step 1: Batch Timing Template selection or inline creation.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface BatchTimeTemplate {
  id: string;
  name: string;
  slot_count?: number;
  // These are populated when fetching individual template details
  days_of_week?: number[] | string[];
  start_time?: string;
  duration?: number;
  // Slots from individual fetch
  slots?: Array<{ day_of_week: string; start_time: string; duration_hours: number }>;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const DURATION_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDays(days: number[] | string[] | null | undefined): string {
  if (!days || !Array.isArray(days) || days.length === 0) return 'No days set';
  // Handle both number[] (0-6) and string[] ('Mon', 'Tue', etc.)
  if (typeof days[0] === 'string') {
    return (days as string[]).join(', ');
  }
  return (days as number[])
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d])
    .join(', ');
}

function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatDuration(duration: number): string {
  if (duration === 1) return '1 hour';
  return `${duration} hours`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const ScheduleStep: React.FC = () => {
  const { state, updateSchedule } = useWizard();

  // Template list state
  const [templates, setTemplates] = useState<BatchTimeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Inline form state
  const [showForm, setShowForm] = useState(state.schedule.isNewTemplate);
  const [formName, setFormName] = useState('');
  const [formDays, setFormDays] = useState<number[]>([]);
  const [formTime, setFormTime] = useState('');
  const [formDuration, setFormDuration] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ─── Fetch Templates ─────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await apiClient.get<BatchTimeTemplate[]>('/batch-time-templates');
      const templateList = Array.isArray(response.data) ? response.data : [];
      
      // Fetch slots for each template to show days/time info
      const templatesWithSlots = await Promise.all(
        templateList.map(async (tpl) => {
          try {
            const detailRes = await apiClient.get<{ id: string; name: string; slots: Array<{ day_of_week: string; start_time: string; duration_hours: number }> }>(`/batch-time-templates/${tpl.id}`);
            return { ...tpl, slots: detailRes.data.slots || [] };
          } catch {
            return tpl;
          }
        })
      );
      
      setTemplates(templatesWithSlots);
    } catch {
      setFetchError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ─── Select Existing Template ────────────────────────────────────────────

  const handleSelectTemplate = (template: BatchTimeTemplate) => {
    setShowForm(false);
    
    // Extract days/time from slots if available
    let daysOfWeek: number[] = [];
    let startTime = '';
    let duration = 0;
    
    if (template.slots && template.slots.length > 0) {
      const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      daysOfWeek = [...new Set(template.slots.map(s => dayMap[s.day_of_week] ?? 0))];
      startTime = template.slots[0].start_time?.slice(0, 5) ?? '';
      duration = template.slots[0].duration_hours ?? 0;
    } else if (template.days_of_week) {
      daysOfWeek = Array.isArray(template.days_of_week)
        ? template.days_of_week.map(d => typeof d === 'string' ? (['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(d)) : d)
        : [];
      startTime = template.start_time ?? '';
      duration = template.duration ?? 0;
    }
    
    updateSchedule({
      templateId: template.id,
      templateName: template.name,
      daysOfWeek,
      startTime,
      duration,
      isNewTemplate: false,
    });
  };

  // ─── Day Toggle ──────────────────────────────────────────────────────────

  const toggleDay = (day: number) => {
    setFormDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // ─── Save New Template ───────────────────────────────────────────────────

  const canSave =
    formName.trim().length > 0 &&
    formDays.length > 0 &&
    formTime.trim().length > 0 &&
    formDuration > 0;

  const handleSaveTemplate = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Transform flat form data into the slots array format the API expects:
      // Each selected day becomes a separate slot with the same start_time and duration_hours.
      // API expects day_of_week as string: "Mon", "Tue", etc. and duration_hours as integer.
      const slots = formDays
        .slice()
        .sort((a, b) => a - b)
        .map((dayIndex) => ({
          day_of_week: DAY_LABELS[dayIndex],
          start_time: formTime,
          duration_hours: Math.floor(formDuration),
        }));

      const response = await apiClient.post<BatchTimeTemplate & { slots: Array<{ day_of_week: string; start_time: string; duration_hours: number }> }>('/batch-time-templates', {
        name: formName.trim(),
        slots,
      });
      const created = response.data;

      // Add to local list and select it
      setTemplates((prev) => [...prev, created]);

      // Map the response slots back to wizard state format
      const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const createdDays = created.slots
        ? [...new Set(created.slots.map(s => dayMap[s.day_of_week] ?? 0))]
        : formDays;
      const createdTime = created.slots?.[0]?.start_time?.slice(0, 5) ?? formTime;
      const createdDuration = created.slots?.[0]?.duration_hours ?? formDuration;

      updateSchedule({
        templateId: created.id,
        templateName: created.name,
        daysOfWeek: createdDays,
        startTime: createdTime,
        duration: createdDuration,
        isNewTemplate: false,
      });

      // Reset form
      setFormName('');
      setFormDays([]);
      setFormTime('');
      setFormDuration(0);
      setShowForm(false);
    } catch {
      setSaveError('Failed to create template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Summary ─────────────────────────────────────────────────────────────

  const showSummary =
    state.schedule.daysOfWeek.length > 0 &&
    state.schedule.startTime &&
    state.schedule.duration > 0;

  const summaryText = showSummary
    ? `${formatDays(state.schedule.daysOfWeek)} · ${formatTime(state.schedule.startTime)} · ${formatDuration(state.schedule.duration)}`
    : '';

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="schedule-step">
      <h2 className="schedule-step__section-title">Select a Timing Template</h2>

      {/* Loading state */}
      {loading && (
        <div className="schedule-step__loading">Loading templates…</div>
      )}

      {/* Error state */}
      {fetchError && (
        <div className="schedule-step__error">
          <span>{fetchError}</span>
          <button className="schedule-step__error-retry" onClick={fetchTemplates}>
            Retry
          </button>
        </div>
      )}

      {/* Template cards */}
      {!loading && !fetchError && templates.length > 0 && (
        <div className="schedule-step__templates">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className={`schedule-step__template-card${
                state.schedule.templateId === tpl.id
                  ? ' schedule-step__template-card--selected'
                  : ''
              }`}
              onClick={() => handleSelectTemplate(tpl)}
              role="button"
              tabIndex={0}
              aria-pressed={state.schedule.templateId === tpl.id}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectTemplate(tpl);
                }
              }}
            >
              <span className="schedule-step__template-name">{tpl.name}</span>
              <span className="schedule-step__template-days">
                {tpl.slots
                  ? formatDays(tpl.slots.map(s => s.day_of_week) as unknown as string[])
                  : tpl.days_of_week
                    ? formatDays(tpl.days_of_week)
                    : `${tpl.slot_count ?? 0} session slots`}
              </span>
              {(tpl.start_time || (tpl.slots && tpl.slots.length > 0)) && (
                <span className="schedule-step__template-time">
                  {tpl.slots && tpl.slots.length > 0
                    ? `${formatTime(tpl.slots[0].start_time)} · ${formatDuration(tpl.slots[0].duration_hours)}`
                    : tpl.start_time
                      ? `${formatTime(tpl.start_time)} · ${formatDuration(tpl.duration ?? 0)}`
                      : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && templates.length === 0 && (
        <div className="schedule-step__empty">
          No templates found. Create one below.
        </div>
      )}

      {/* Toggle to show inline form */}
      <button
        className={`schedule-step__toggle-btn${showForm ? ' schedule-step__toggle-btn--open' : ''}`}
        onClick={() => setShowForm((prev) => !prev)}
        type="button"
      >
        {showForm ? '▾ Hide Form' : '▸ Create New Template'}
      </button>

      {/* Inline creation form */}
      {showForm && (
        <div className="schedule-step__inline-form">
          {/* Template Name */}
          <div className="schedule-step__field">
            <label className="schedule-step__label" htmlFor="tpl-name">
              Template Name
            </label>
            <input
              id="tpl-name"
              className="schedule-step__input"
              type="text"
              placeholder="e.g. Morning MWF"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          {/* Day Toggles */}
          <div className="schedule-step__field">
            <span className="schedule-step__label">Days of Week</span>
            <div className="schedule-step__day-toggles" role="group" aria-label="Days of week">
              {DAY_LABELS.map((label, index) => (
                <button
                  key={index}
                  type="button"
                  className={`schedule-step__day-pill${
                    formDays.includes(index) ? ' schedule-step__day-pill--active' : ''
                  }`}
                  onClick={() => toggleDay(index)}
                  aria-pressed={formDays.includes(index)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Time + Duration Row */}
          <div className="schedule-step__form-row">
            <div className="schedule-step__field">
              <label className="schedule-step__label" htmlFor="tpl-time">
                Start Time
              </label>
              <input
                id="tpl-time"
                className="schedule-step__input"
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
              />
            </div>

            <div className="schedule-step__field">
              <label className="schedule-step__label" htmlFor="tpl-duration">
                Duration
              </label>
              <select
                id="tpl-duration"
                className="schedule-step__select"
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value))}
              >
                <option value={0} disabled>
                  Select…
                </option>
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d === 1 ? '1 hour' : `${d} hours`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Save error */}
          {saveError && (
            <div className="schedule-step__error">
              <span>{saveError}</span>
            </div>
          )}

          {/* Save button */}
          <button
            className="schedule-step__save-btn"
            type="button"
            disabled={!canSave || saving}
            onClick={handleSaveTemplate}
          >
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      )}

      {/* Schedule Summary */}
      {showSummary && (
        <div className="schedule-step__summary">
          <span className="schedule-step__summary-icon">📅</span>
          <span>{summaryText}</span>
        </div>
      )}
    </div>
  );
};

export default ScheduleStep;

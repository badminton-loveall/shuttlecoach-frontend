/**
 * ScheduleBuilder Component
 * A structured schedule builder with day-of-week toggles, time pickers,
 * recurrence configuration, and multiple slots per day support.
 *
 * Requirements: 16.1, 16.3, 16.4
 * - 16.1: Day-of-week selection (S, M, T, W, T, F, S toggles), start/end time pickers
 * - 16.3: Multiple Session_Slots per day for the same batch
 * - 16.4: Recurrence config with repeat interval, repeat days, and end condition
 */

import React, { useState, useCallback } from 'react';
import type { SessionSlot, RecurrencePattern, DayOfWeek, EndType } from '../types';

/* --------------------------------------------------------------------------
   Types
   -------------------------------------------------------------------------- */

export interface ScheduleBuilderProps {
  /** Initial slots to populate the builder */
  initialSlots?: SessionSlot[];
  /** Initial recurrence pattern */
  initialRecurrence?: RecurrencePattern;
  /** Callback when schedule changes */
  onChange?: (slots: SessionSlot[], recurrence: RecurrencePattern) => void;
  /** Callback when user saves */
  onSave?: (slots: SessionSlot[], recurrence: RecurrencePattern) => void;
  /** Whether the form is read-only */
  readOnly?: boolean;
  /** Whether a save operation is in progress */
  isSaving?: boolean;
}

interface SlotEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

/* --------------------------------------------------------------------------
   Constants
   -------------------------------------------------------------------------- */

const DAY_LABELS: { day: DayOfWeek; label: string; fullLabel: string }[] = [
  { day: 0, label: 'S', fullLabel: 'Sunday' },
  { day: 1, label: 'M', fullLabel: 'Monday' },
  { day: 2, label: 'T', fullLabel: 'Tuesday' },
  { day: 3, label: 'W', fullLabel: 'Wednesday' },
  { day: 4, label: 'T', fullLabel: 'Thursday' },
  { day: 5, label: 'F', fullLabel: 'Friday' },
  { day: 6, label: 'S', fullLabel: 'Saturday' },
];

const DEFAULT_START_TIME = '06:00';
const DEFAULT_END_TIME = '07:30';

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

let slotIdCounter = 0;
function generateSlotId(): string {
  slotIdCounter += 1;
  return `slot-${Date.now()}-${slotIdCounter}`;
}

function slotsToEntries(slots: SessionSlot[]): SlotEntry[] {
  return slots.map((slot) => ({
    id: generateSlotId(),
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));
}

function entriesToSlots(entries: SlotEntry[]): SessionSlot[] {
  return entries.map(({ dayOfWeek, startTime, endTime }) => ({
    dayOfWeek,
    startTime,
    endTime,
  }));
}

function getDefaultRecurrence(days: DayOfWeek[]): RecurrencePattern {
  return {
    repeatEvery: 1,
    repeatUnit: 'week',
    repeatDays: days,
    endType: 'never',
  };
}

/* --------------------------------------------------------------------------
   Component
   -------------------------------------------------------------------------- */

export const ScheduleBuilder: React.FC<ScheduleBuilderProps> = ({
  initialSlots = [],
  initialRecurrence,
  onChange,
  onSave,
  readOnly = false,
  isSaving = false,
}) => {
  const [slotEntries, setSlotEntries] = useState<SlotEntry[]>(() =>
    initialSlots.length > 0 ? slotsToEntries(initialSlots) : []
  );

  const [recurrence, setRecurrence] = useState<RecurrencePattern>(() => {
    if (initialRecurrence) return initialRecurrence;
    const days = [...new Set(initialSlots.map((s) => s.dayOfWeek))];
    return getDefaultRecurrence(days as DayOfWeek[]);
  });

  // Notify parent of changes
  const notifyChange = useCallback(
    (entries: SlotEntry[], rec: RecurrencePattern) => {
      onChange?.(entriesToSlots(entries), rec);
    },
    [onChange]
  );

  /* ---- Day toggle handling ---- */

  const selectedDays = new Set(recurrence.repeatDays);

  const handleDayToggle = (day: DayOfWeek) => {
    if (readOnly) return;

    const newDays = new Set(selectedDays);
    if (newDays.has(day)) {
      newDays.delete(day);
      // Remove all slots for this day
      const newEntries = slotEntries.filter((e) => e.dayOfWeek !== day);
      setSlotEntries(newEntries);
      const newRecurrence = { ...recurrence, repeatDays: [...newDays].sort() as DayOfWeek[] };
      setRecurrence(newRecurrence);
      notifyChange(newEntries, newRecurrence);
    } else {
      newDays.add(day);
      // Add a default slot for this day
      const newEntry: SlotEntry = {
        id: generateSlotId(),
        dayOfWeek: day,
        startTime: DEFAULT_START_TIME,
        endTime: DEFAULT_END_TIME,
      };
      const newEntries = [...slotEntries, newEntry];
      setSlotEntries(newEntries);
      const newRecurrence = { ...recurrence, repeatDays: [...newDays].sort() as DayOfWeek[] };
      setRecurrence(newRecurrence);
      notifyChange(newEntries, newRecurrence);
    }
  };

  /* ---- Slot management ---- */

  const handleAddSlot = (day: DayOfWeek) => {
    if (readOnly) return;
    const newEntry: SlotEntry = {
      id: generateSlotId(),
      dayOfWeek: day,
      startTime: DEFAULT_START_TIME,
      endTime: DEFAULT_END_TIME,
    };
    const newEntries = [...slotEntries, newEntry];
    setSlotEntries(newEntries);
    notifyChange(newEntries, recurrence);
  };

  const handleRemoveSlot = (slotId: string) => {
    if (readOnly) return;
    const entry = slotEntries.find((e) => e.id === slotId);
    const newEntries = slotEntries.filter((e) => e.id !== slotId);
    setSlotEntries(newEntries);

    // If no more slots for this day, remove the day from repeatDays
    if (entry) {
      const remainingForDay = newEntries.filter((e) => e.dayOfWeek === entry.dayOfWeek);
      if (remainingForDay.length === 0) {
        const newDays = recurrence.repeatDays.filter((d) => d !== entry.dayOfWeek);
        const newRecurrence = { ...recurrence, repeatDays: newDays };
        setRecurrence(newRecurrence);
        notifyChange(newEntries, newRecurrence);
        return;
      }
    }
    notifyChange(newEntries, recurrence);
  };

  const handleSlotTimeChange = (slotId: string, field: 'startTime' | 'endTime', value: string) => {
    if (readOnly) return;
    const newEntries = slotEntries.map((e) =>
      e.id === slotId ? { ...e, [field]: value } : e
    );
    setSlotEntries(newEntries);
    notifyChange(newEntries, recurrence);
  };

  /* ---- Recurrence config ---- */

  const handleRepeatEveryChange = (value: number) => {
    if (readOnly) return;
    const newRecurrence = { ...recurrence, repeatEvery: Math.max(1, value) };
    setRecurrence(newRecurrence);
    notifyChange(slotEntries, newRecurrence);
  };

  const handleEndTypeChange = (endType: EndType) => {
    if (readOnly) return;
    const newRecurrence: RecurrencePattern = {
      ...recurrence,
      endType,
      endDate: endType === 'on_date' ? recurrence.endDate : undefined,
      occurrenceCount: endType === 'after_count' ? (recurrence.occurrenceCount || 10) : undefined,
    };
    setRecurrence(newRecurrence);
    notifyChange(slotEntries, newRecurrence);
  };

  const handleEndDateChange = (value: string) => {
    if (readOnly) return;
    const newRecurrence = { ...recurrence, endDate: value };
    setRecurrence(newRecurrence);
    notifyChange(slotEntries, newRecurrence);
  };

  const handleOccurrenceCountChange = (value: number) => {
    if (readOnly) return;
    const newRecurrence = { ...recurrence, occurrenceCount: Math.max(1, value) };
    setRecurrence(newRecurrence);
    notifyChange(slotEntries, newRecurrence);
  };

  /* ---- Save ---- */

  const handleSave = () => {
    if (readOnly || isSaving) return;
    onSave?.(entriesToSlots(slotEntries), recurrence);
  };

  /* ---- Group slots by day ---- */

  const slotsByDay = DAY_LABELS
    .filter(({ day }) => selectedDays.has(day))
    .map(({ day, fullLabel }) => ({
      day,
      label: fullLabel,
      slots: slotEntries.filter((e) => e.dayOfWeek === day),
    }));

  /* ---- Validation ---- */

  const hasSlots = slotEntries.length > 0;
  const hasTimeErrors = slotEntries.some((e) => e.startTime >= e.endTime);

  return (
    <div className="space-y-6" data-testid="schedule-builder">
      {/* Day-of-Week Toggles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Training Days
        </label>
        <div className="flex gap-2" role="group" aria-label="Day of week selection">
          {DAY_LABELS.map(({ day, label, fullLabel }) => (
            <button
              key={day}
              type="button"
              onClick={() => handleDayToggle(day)}
              disabled={readOnly}
              aria-label={fullLabel}
              aria-pressed={selectedDays.has(day)}
              className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                selectedDays.has(day)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots by Day */}
      {slotsByDay.length > 0 && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Session Time Slots
          </label>

          {slotsByDay.map(({ day, label, slots }) => (
            <div
              key={day}
              className="rounded-lg p-4"
              style={{ border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-800">
                  {label}
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleAddSlot(day)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    aria-label={`Add another slot on ${label}`}
                  >
                    + Add Slot
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {slots.map((slot, idx) => (
                  <div key={slot.id} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <label className="sr-only" htmlFor={`start-${slot.id}`}>
                        Start time for {label} slot {idx + 1}
                      </label>
                      <input
                        id={`start-${slot.id}`}
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => handleSlotTimeChange(slot.id, 'startTime', e.target.value)}
                        disabled={readOnly}
                        className="rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                        style={{ border: '1px solid var(--border-default)' }}
                      />
                      <span className="text-gray-500 text-sm">to</span>
                      <label className="sr-only" htmlFor={`end-${slot.id}`}>
                        End time for {label} slot {idx + 1}
                      </label>
                      <input
                        id={`end-${slot.id}`}
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => handleSlotTimeChange(slot.id, 'endTime', e.target.value)}
                        disabled={readOnly}
                        className="rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                        style={{ border: '1px solid var(--border-default)' }}
                      />
                    </div>

                    {!readOnly && slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label={`Remove slot ${idx + 1} on ${label}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {/* Validation warning */}
                {slots.some((s) => s.startTime >= s.endTime) && (
                  <p className="text-xs text-red-500 mt-1">
                    Start time must be before end time
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recurrence Configuration */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Recurrence
        </label>

        <div className="rounded-lg p-4 space-y-4" style={{ border: '1px solid var(--border-default)' }}>
          {/* Repeat Every */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">Repeat every</span>
            <input
              type="number"
              min={1}
              max={12}
              value={recurrence.repeatEvery}
              onChange={(e) => handleRepeatEveryChange(parseInt(e.target.value, 10) || 1)}
              disabled={readOnly}
              className="w-16 rounded-md bg-white px-2 py-1.5 text-sm text-center text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              style={{ border: '1px solid var(--border-default)' }}
              aria-label="Repeat interval in weeks"
            />
            <span className="text-sm text-gray-700">
              week{recurrence.repeatEvery > 1 ? 's' : ''}
            </span>
          </div>

          {/* End Condition */}
          <div className="space-y-3">
            <span className="text-sm text-gray-700">Ends</span>

            <div className="flex flex-col gap-3 ml-1">
              {/* Never */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  value="never"
                  checked={recurrence.endType === 'never'}
                  onChange={() => handleEndTypeChange('never')}
                  disabled={readOnly}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Never</span>
              </label>

              {/* On Date */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  value="on_date"
                  checked={recurrence.endType === 'on_date'}
                  onChange={() => handleEndTypeChange('on_date')}
                  disabled={readOnly}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">On date</span>
                {recurrence.endType === 'on_date' && (
                  <input
                    type="date"
                    value={recurrence.endDate || ''}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    disabled={readOnly}
                    className="ml-2 rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                    style={{ border: '1px solid var(--border-default)' }}
                    aria-label="End date"
                  />
                )}
              </label>

              {/* After N Occurrences */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  value="after_count"
                  checked={recurrence.endType === 'after_count'}
                  onChange={() => handleEndTypeChange('after_count')}
                  disabled={readOnly}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">After</span>
                {recurrence.endType === 'after_count' && (
                  <>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={recurrence.occurrenceCount || 10}
                      onChange={(e) => handleOccurrenceCountChange(parseInt(e.target.value, 10) || 1)}
                      disabled={readOnly}
                      className="w-16 rounded-md bg-white px-2 py-1.5 text-sm text-center text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                      style={{ border: '1px solid var(--border-default)' }}
                      aria-label="Number of occurrences"
                    />
                    <span className="text-sm text-gray-700">occurrences</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {onSave && !readOnly && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasSlots || hasTimeErrors || isSaving}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ScheduleBuilder;

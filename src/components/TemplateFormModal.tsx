import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * TemplateFormModal Component
 * Modal form for creating or editing batch time templates.
 * Includes session slot management with real-time overlap validation.
 *
 * Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5
 */

// --- Types ---

type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

interface SessionSlot {
  day_of_week: DayOfWeek;
  start_time: string;
  duration_hours: number;
}

export interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTemplate?: {
    id: string;
    name: string;
    slots: Array<{ day_of_week: string; start_time: string; duration_hours: number }>;
  } | null;
}

// --- Constants ---

const DAYS_OF_WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DURATION_OPTIONS = [1, 2, 3, 4];
const MAX_SLOTS = 14;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// --- Validation ---

interface ValidationErrors {
  name?: string;
  slots?: string;
  slotErrors?: Map<number, string>;
}

function validateName(name: string): string | undefined {
  if (!name.trim()) return 'Name is required';
  if (name.length > 100) return 'Name must be at most 100 characters';
  return undefined;
}

function validateSlotTime(time: string): boolean {
  return TIME_REGEX.test(time);
}

function validateForm(name: string, slots: SessionSlot[]): ValidationErrors {
  const errors: ValidationErrors = {};
  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  if (slots.length === 0) {
    errors.slots = 'At least one session slot is required';
  } else if (slots.length > MAX_SLOTS) {
    errors.slots = `Maximum ${MAX_SLOTS} session slots allowed`;
  }

  const slotErrors = new Map<number, string>();
  slots.forEach((slot, idx) => {
    if (!validateSlotTime(slot.start_time)) {
      slotErrors.set(idx, 'Invalid time format (HH:MM)');
    }
    if (!DAYS_OF_WEEK.includes(slot.day_of_week)) {
      slotErrors.set(idx, 'Invalid day');
    }
    if (slot.duration_hours < 1 || slot.duration_hours > 4) {
      slotErrors.set(idx, 'Duration must be 1–4 hours');
    }
  });

  if (slotErrors.size > 0) errors.slotErrors = slotErrors;
  return errors;
}

// --- Overlap Detection ---

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function detectOverlaps(slots: SessionSlot[]): Set<number> {
  const conflictingIndices = new Set<number>();

  // Group slot indices by day_of_week
  const dayGroups = new Map<string, number[]>();
  for (let i = 0; i < slots.length; i++) {
    const day = slots[i].day_of_week;
    if (!dayGroups.has(day)) dayGroups.set(day, []);
    dayGroups.get(day)!.push(i);
  }

  // For each day, check pairwise overlap
  for (const indices of dayGroups.values()) {
    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const idxA = indices[a];
        const idxB = indices[b];
        const slotA = slots[idxA];
        const slotB = slots[idxB];

        // Only check if both have valid times
        if (!validateSlotTime(slotA.start_time) || !validateSlotTime(slotB.start_time)) continue;

        const startA = timeToMinutes(slotA.start_time);
        const endA = startA + slotA.duration_hours * 60;
        const startB = timeToMinutes(slotB.start_time);
        const endB = startB + slotB.duration_hours * 60;

        if (startA < endB && startB < endA) {
          conflictingIndices.add(idxA);
          conflictingIndices.add(idxB);
        }
      }
    }
  }

  return conflictingIndices;
}

// --- Component ---

export const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingTemplate,
}) => {
  const [name, setName] = useState('');
  const [slots, setSlots] = useState<SessionSlot[]>([{ day_of_week: 'Mon', start_time: '09:00', duration_hours: 1 }]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [overlapIndices, setOverlapIndices] = useState<Set<number>>(new Set());
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(editingTemplate);

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (editingTemplate) {
        setName(editingTemplate.name);
        setSlots(
          editingTemplate.slots.map((s) => ({
            day_of_week: s.day_of_week as DayOfWeek,
            start_time: s.start_time,
            duration_hours: s.duration_hours,
          }))
        );
      } else {
        setName('');
        setSlots([{ day_of_week: 'Mon', start_time: '09:00', duration_hours: 1 }]);
      }
      setErrors({});
      setOverlapIndices(new Set());
      setServerError(null);
    }
  }, [isOpen, editingTemplate]);

  // Run overlap detection on slot changes
  const updateOverlaps = useCallback((currentSlots: SessionSlot[]) => {
    const conflicts = detectOverlaps(currentSlots);
    setOverlapIndices(conflicts);
  }, []);

  useEffect(() => {
    updateOverlaps(slots);
  }, [slots, updateOverlaps]);

  // Slot management
  const addSlot = () => {
    if (slots.length >= MAX_SLOTS) return;
    const newSlots = [...slots, { day_of_week: 'Mon' as DayOfWeek, start_time: '09:00', duration_hours: 1 }];
    setSlots(newSlots);
  };

  const removeSlot = (index: number) => {
    const newSlots = slots.filter((_, i) => i !== index);
    setSlots(newSlots);
  };

  const updateSlot = (index: number, field: keyof SessionSlot, value: string | number) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Validate
    const validationErrors = validateForm(name, slots);
    if (overlapIndices.size > 0) {
      validationErrors.slots = 'Session slots have overlapping times';
    }
    setErrors(validationErrors);

    const hasErrors = validationErrors.name || validationErrors.slots || (validationErrors.slotErrors && validationErrors.slotErrors.size > 0);
    if (hasErrors) return;

    try {
      setIsSubmitting(true);
      const payload = { name: name.trim(), slots };

      if (isEditing && editingTemplate) {
        await apiClient.patch(`/batch-time-templates/${editingTemplate.id}`, payload);
      } else {
        await apiClient.post('/batch-time-templates', payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { error?: string; errors?: Array<{ message: string }> } } }).response;
        if (response?.data?.error) {
          setServerError(response.data.error);
        } else if (response?.data?.errors && response.data.errors.length > 0) {
          setServerError(response.data.errors.map((e) => e.message).join(', '));
        } else {
          setServerError('An unexpected error occurred. Please try again.');
        }
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content modal-content--large"
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {isEditing ? 'Edit Batch' : 'Create Batch'}
            </h2>
            <p className="modal-subtitle">
              {isEditing
                ? 'Update the batch name and session slots'
                : 'Define a reusable weekly session schedule for your batch'}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Server Error */}
            {serverError && (
              <div className="form-error-banner">
                {serverError}
              </div>
            )}

            {/* Batch Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="template-name">
                Batch Name
              </label>
              <input
                id="template-name"
                type="text"
                className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning Weekday Schedule"
                maxLength={100}
                disabled={isSubmitting}
              />
              {errors.name && (
                <span className="form-error-text">{errors.name}</span>
              )}
            </div>

            {/* Session Slots */}
            <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Session Slots ({slots.length}/{MAX_SLOTS})
                </label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addSlot}
                  disabled={slots.length >= MAX_SLOTS || isSubmitting}
                  style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--font-sm)' }}
                >
                  + Add Slot
                </button>
              </div>

              {errors.slots && (
                <span className="form-error-text" style={{ marginBottom: 'var(--space-sm)', display: 'block' }}>
                  {errors.slots}
                </span>
              )}

              {/* Slot List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {slots.map((slot, index) => {
                  const hasOverlap = overlapIndices.has(index);
                  const slotError = errors.slotErrors?.get(index);

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)',
                        padding: 'var(--space-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${hasOverlap ? 'var(--color-danger)' : 'var(--border-default)'}`,
                        backgroundColor: hasOverlap ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Day Picker */}
                      <select
                        value={slot.day_of_week}
                        onChange={(e) => updateSlot(index, 'day_of_week', e.target.value)}
                        className="form-input"
                        style={{ width: '90px', flex: 'none' }}
                        disabled={isSubmitting}
                        aria-label={`Day for slot ${index + 1}`}
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>

                      {/* Start Time */}
                      <input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                        className={`form-input ${slotError ? 'form-input-error' : ''}`}
                        style={{ width: '120px', flex: 'none' }}
                        disabled={isSubmitting}
                        aria-label={`Start time for slot ${index + 1}`}
                      />

                      {/* Duration Select */}
                      <select
                        value={slot.duration_hours}
                        onChange={(e) => updateSlot(index, 'duration_hours', Number(e.target.value))}
                        className="form-input"
                        style={{ width: '100px', flex: 'none' }}
                        disabled={isSubmitting}
                        aria-label={`Duration for slot ${index + 1}`}
                      >
                        {DURATION_OPTIONS.map((d) => (
                          <option key={d} value={d}>{d} hr{d > 1 ? 's' : ''}</option>
                        ))}
                      </select>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeSlot(index)}
                        disabled={isSubmitting || slots.length <= 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-danger)',
                          cursor: slots.length <= 1 ? 'not-allowed' : 'pointer',
                          padding: 'var(--space-xs)',
                          borderRadius: 'var(--radius-sm)',
                          opacity: slots.length <= 1 ? 0.4 : 1,
                          fontSize: 'var(--font-base)',
                          lineHeight: 1,
                        }}
                        aria-label={`Remove slot ${index + 1}`}
                        title="Remove slot"
                      >
                        ✕
                      </button>

                      {/* Overlap / Error Indicator */}
                      {(hasOverlap || slotError) && (
                        <span
                          style={{
                            width: '100%',
                            fontSize: 'var(--font-xs)',
                            color: 'var(--color-danger)',
                            marginTop: 'var(--space-xs)',
                          }}
                        >
                          {hasOverlap ? 'Overlaps with another slot on the same day' : slotError}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || overlapIndices.size > 0}
            >
              {isSubmitting
                ? (isEditing ? 'Saving...' : 'Creating...')
                : (isEditing ? 'Save Changes' : 'Create Batch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateFormModal;

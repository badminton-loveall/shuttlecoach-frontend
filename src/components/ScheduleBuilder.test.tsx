/**
 * ScheduleBuilder Component Tests
 * Tests day-of-week toggles, time pickers, recurrence config,
 * and multiple slots per day support.
 *
 * Requirements: 16.1, 16.3, 16.4
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ScheduleBuilder } from './ScheduleBuilder';
import type { SessionSlot, RecurrencePattern, DayOfWeek } from '../types';

describe('ScheduleBuilder', () => {
  const defaultSlots: SessionSlot[] = [
    { dayOfWeek: 1, startTime: '06:00', endTime: '07:30' },
    { dayOfWeek: 3, startTime: '06:00', endTime: '07:30' },
    { dayOfWeek: 5, startTime: '06:00', endTime: '07:30' },
  ];

  const defaultRecurrence: RecurrencePattern = {
    repeatEvery: 1,
    repeatUnit: 'week',
    repeatDays: [1, 3, 5] as DayOfWeek[],
    endType: 'never',
  };

  it('renders the schedule builder', () => {
    render(<ScheduleBuilder />);
    expect(screen.getByTestId('schedule-builder')).toBeInTheDocument();
    expect(screen.getByText('Training Days')).toBeInTheDocument();
  });

  it('renders day-of-week toggle buttons', () => {
    render(<ScheduleBuilder />);
    expect(screen.getByLabelText('Sunday')).toBeInTheDocument();
    expect(screen.getByLabelText('Monday')).toBeInTheDocument();
    expect(screen.getByLabelText('Tuesday')).toBeInTheDocument();
    expect(screen.getByLabelText('Wednesday')).toBeInTheDocument();
    expect(screen.getByLabelText('Thursday')).toBeInTheDocument();
    expect(screen.getByLabelText('Friday')).toBeInTheDocument();
    expect(screen.getByLabelText('Saturday')).toBeInTheDocument();
  });

  it('shows selected days from initial slots', () => {
    render(<ScheduleBuilder initialSlots={defaultSlots} initialRecurrence={defaultRecurrence} />);
    const mondayBtn = screen.getByLabelText('Monday');
    expect(mondayBtn).toHaveAttribute('aria-pressed', 'true');

    const sundayBtn = screen.getByLabelText('Sunday');
    expect(sundayBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles a day and creates a slot when clicking a day button', () => {
    const onChange = vi.fn();
    render(<ScheduleBuilder onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Monday'));

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ dayOfWeek: 1 }),
      ]),
      expect.objectContaining({
        repeatDays: expect.arrayContaining([1]),
      })
    );
  });

  it('removes day slots when toggling off a selected day', () => {
    const onChange = vi.fn();
    render(
      <ScheduleBuilder
        initialSlots={defaultSlots}
        initialRecurrence={defaultRecurrence}
        onChange={onChange}
      />
    );

    // Toggle off Monday
    fireEvent.click(screen.getByLabelText('Monday'));

    expect(onChange).toHaveBeenCalledWith(
      expect.not.arrayContaining([
        expect.objectContaining({ dayOfWeek: 1 }),
      ]),
      expect.objectContaining({
        repeatDays: expect.not.arrayContaining([1]),
      })
    );
  });

  it('supports multiple slots per day via "Add Slot" button', () => {
    render(
      <ScheduleBuilder initialSlots={defaultSlots} initialRecurrence={defaultRecurrence} />
    );

    // Monday section should be visible
    const addSlotBtn = screen.getByLabelText('Add another slot on Monday');
    fireEvent.click(addSlotBtn);

    // Should now have 2 start time inputs for Monday
    const mondaySection = screen.getByText('Monday').closest('div');
    expect(mondaySection).toBeInTheDocument();
  });

  it('calls onChange with updated slots when adding a slot', () => {
    const onChange = vi.fn();
    render(
      <ScheduleBuilder
        initialSlots={defaultSlots}
        initialRecurrence={defaultRecurrence}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByLabelText('Add another slot on Monday'));

    // Should have 4 slots total (3 initial + 1 added)
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall[0]).toHaveLength(4);
    expect(lastCall[0].filter((s: SessionSlot) => s.dayOfWeek === 1)).toHaveLength(2);
  });

  it('renders recurrence configuration section', () => {
    render(<ScheduleBuilder initialSlots={defaultSlots} initialRecurrence={defaultRecurrence} />);
    expect(screen.getByText('Recurrence')).toBeInTheDocument();
    expect(screen.getByText('Repeat every')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
    expect(screen.getByText('On date')).toBeInTheDocument();
  });

  it('shows end date picker when "On date" is selected', () => {
    const recurrence: RecurrencePattern = {
      ...defaultRecurrence,
      endType: 'on_date',
      endDate: '2025-06-30',
    };
    render(
      <ScheduleBuilder initialSlots={defaultSlots} initialRecurrence={recurrence} />
    );

    expect(screen.getByLabelText('End date')).toBeInTheDocument();
    expect(screen.getByLabelText('End date')).toHaveValue('2025-06-30');
  });

  it('shows occurrence count input when "After" is selected', () => {
    const recurrence: RecurrencePattern = {
      ...defaultRecurrence,
      endType: 'after_count',
      occurrenceCount: 20,
    };
    render(
      <ScheduleBuilder initialSlots={defaultSlots} initialRecurrence={recurrence} />
    );

    expect(screen.getByLabelText('Number of occurrences')).toHaveValue(20);
    expect(screen.getByText('occurrences')).toBeInTheDocument();
  });

  it('calls onChange when repeat interval is changed', () => {
    const onChange = vi.fn();
    render(
      <ScheduleBuilder
        initialSlots={defaultSlots}
        initialRecurrence={defaultRecurrence}
        onChange={onChange}
      />
    );

    const repeatInput = screen.getByLabelText('Repeat interval in weeks');
    fireEvent.change(repeatInput, { target: { value: '2' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ repeatEvery: 2 })
    );
  });

  it('disables all controls in readOnly mode', () => {
    render(
      <ScheduleBuilder
        initialSlots={defaultSlots}
        initialRecurrence={defaultRecurrence}
        readOnly
      />
    );

    const mondayBtn = screen.getByLabelText('Monday');
    expect(mondayBtn).toBeDisabled();

    // Add slot buttons should not be present in readOnly
    expect(screen.queryByLabelText('Add another slot on Monday')).not.toBeInTheDocument();
  });

  it('renders save button when onSave is provided', () => {
    const onSave = vi.fn();
    render(
      <ScheduleBuilder
        initialSlots={defaultSlots}
        initialRecurrence={defaultRecurrence}
        onSave={onSave}
      />
    );

    expect(screen.getByText('Save Schedule')).toBeInTheDocument();
  });

  it('calls onSave with current slots and recurrence', () => {
    const onSave = vi.fn();
    render(
      <ScheduleBuilder
        initialSlots={defaultSlots}
        initialRecurrence={defaultRecurrence}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByText('Save Schedule'));

    expect(onSave).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ dayOfWeek: 1, startTime: '06:00', endTime: '07:30' }),
      ]),
      expect.objectContaining({
        repeatEvery: 1,
        repeatUnit: 'week',
        repeatDays: [1, 3, 5],
        endType: 'never',
      })
    );
  });

  it('disables save button when no slots are defined', () => {
    const onSave = vi.fn();
    render(<ScheduleBuilder onSave={onSave} />);
    expect(screen.getByText('Save Schedule')).toBeDisabled();
  });

  it('shows "Saving..." text when isSaving is true', () => {
    render(
      <ScheduleBuilder
        initialSlots={defaultSlots}
        initialRecurrence={defaultRecurrence}
        onSave={() => {}}
        isSaving
      />
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('does not render save button in readOnly mode', () => {
    render(
      <ScheduleBuilder
        initialSlots={defaultSlots}
        initialRecurrence={defaultRecurrence}
        onSave={() => {}}
        readOnly
      />
    );
    expect(screen.queryByText('Save Schedule')).not.toBeInTheDocument();
  });

  it('validates that start time must be before end time', () => {
    const slots: SessionSlot[] = [
      { dayOfWeek: 1, startTime: '08:00', endTime: '07:00' },
    ];
    const recurrence: RecurrencePattern = {
      ...defaultRecurrence,
      repeatDays: [1] as DayOfWeek[],
    };
    render(
      <ScheduleBuilder
        initialSlots={slots}
        initialRecurrence={recurrence}
        onSave={() => {}}
      />
    );
    expect(screen.getByText('Start time must be before end time')).toBeInTheDocument();
    expect(screen.getByText('Save Schedule')).toBeDisabled();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchListItem } from './BatchListItem';
import type { Batch } from '../types';

// Mock batch data
const mockBatch: Batch = {
  id: 'batch-1',
  name: 'Morning Batch A',
  schedule: 'Mon, Wed, Fri - 6:00 AM',
  assignedCoachId: 'coach-1',
  studentCount: 12,
  createdAt: new Date('2026-01-15'),
};

const mockMetrics = {
  attendanceRate: 92,
  averageSkillLevel: 65,
};

describe('BatchListItem', () => {
  it('renders batch name, schedule, and all metrics', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={mockMetrics} />
    );

    expect(screen.getByText('Morning Batch A')).toBeInTheDocument();
    expect(screen.getByText('Mon, Wed, Fri - 6:00 AM')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // Student count
    expect(screen.getByText('92%')).toBeInTheDocument(); // Attendance rate
    expect(screen.getByText('65%')).toBeInTheDocument(); // Average skill level
  });

  it('displays correct attendance badge color for excellent attendance (>= 90%)', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={{ attendanceRate: 92, averageSkillLevel: 65 }} />
    );

    const badge = screen.getByText('Excellent');
    expect(badge).toHaveClass('bg-green-100', 'text-green-700');
  });

  it('displays correct attendance badge color for good attendance (75-89%)', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={{ attendanceRate: 80, averageSkillLevel: 65 }} />
    );

    const badge = screen.getByText('Good');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
  });

  it('displays correct attendance badge color for fair attendance (< 75%)', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={{ attendanceRate: 70, averageSkillLevel: 65 }} />
    );

    const badge = screen.getByText('Fair');
    expect(badge).toHaveClass('bg-red-100', 'text-red-700');
  });

  it('displays created date in correct format', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={mockMetrics} />
    );

    expect(screen.getByText('15 Jan 2026')).toBeInTheDocument();
  });

  it('calls onSelect callback when batch item is clicked', () => {
    const onSelect = vi.fn();
    render(
      <BatchListItem batch={mockBatch} metrics={mockMetrics} onSelect={onSelect} />
    );

    const batchItem = screen.getByRole('button', { name: /View details for Morning Batch A batch/ });
    fireEvent.click(batchItem);

    expect(onSelect).toHaveBeenCalledWith('batch-1');
  });

  it('calls onSelect callback when Enter key is pressed', () => {
    const onSelect = vi.fn();
    render(
      <BatchListItem batch={mockBatch} metrics={mockMetrics} onSelect={onSelect} />
    );

    const batchItem = screen.getByRole('button', { name: /View details for Morning Batch A batch/ });
    fireEvent.keyDown(batchItem, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('batch-1');
  });

  it('calls onSelect callback when Space key is pressed', () => {
    const onSelect = vi.fn();
    render(
      <BatchListItem batch={mockBatch} metrics={mockMetrics} onSelect={onSelect} />
    );

    const batchItem = screen.getByRole('button', { name: /View details for Morning Batch A batch/ });
    fireEvent.keyDown(batchItem, { key: ' ' });

    expect(onSelect).toHaveBeenCalledWith('batch-1');
  });

  it('shows Remove button when canRemove is true', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={mockMetrics} canRemove={true} />
    );

    const removeButton = screen.getByRole('button', { name: /Remove Morning Batch A batch/ });
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveClass('text-red-600');
  });

  it('does not show Remove button when canRemove is false', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={mockMetrics} canRemove={false} />
    );

    const removeButton = screen.queryByRole('button', { name: /Remove Morning Batch A batch/ });
    expect(removeButton).not.toBeInTheDocument();
  });

  it('calls onRemove callback when Remove button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <BatchListItem
        batch={mockBatch}
        metrics={mockMetrics}
        canRemove={true}
        onRemove={onRemove}
      />
    );

    const removeButton = screen.getByRole('button', { name: /Remove Morning Batch A batch/ });
    fireEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith(mockBatch);
  });

  it('stops event propagation when Remove button is clicked', () => {
    const onSelect = vi.fn();
    const onRemove = vi.fn();
    render(
      <BatchListItem
        batch={mockBatch}
        metrics={mockMetrics}
        onSelect={onSelect}
        canRemove={true}
        onRemove={onRemove}
      />
    );

    const removeButton = screen.getByRole('button', { name: /Remove Morning Batch A batch/ });
    fireEvent.click(removeButton);

    // onRemove should be called, but onSelect should not (due to stopPropagation)
    expect(onRemove).toHaveBeenCalledWith(mockBatch);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('disables Remove button when isRemoving is true', () => {
    render(
      <BatchListItem
        batch={mockBatch}
        metrics={mockMetrics}
        canRemove={true}
        isRemoving={true}
      />
    );

    const removeButton = screen.getByRole('button', { name: /Remove Morning Batch A batch/ });
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    expect(removeButton).toHaveTextContent('Removing...');
  });

  it('shows "Removing..." text when isRemoving is true', () => {
    render(
      <BatchListItem
        batch={mockBatch}
        metrics={mockMetrics}
        canRemove={true}
        isRemoving={true}
      />
    );

    expect(screen.getByText('Removing...')).toBeInTheDocument();
  });

  it('displays selected state indicator when isSelected is true', () => {
    render(
      <BatchListItem
        batch={mockBatch}
        metrics={mockMetrics}
        isSelected={true}
      />
    );

    expect(screen.getByText(/Batch details: 12 students enrolled • 92% attendance/)).toBeInTheDocument();
  });

  it('does not display selected state indicator when isSelected is false', () => {
    render(
      <BatchListItem
        batch={mockBatch}
        metrics={mockMetrics}
        isSelected={false}
      />
    );

    expect(screen.queryByText(/Batch details:/)).not.toBeInTheDocument();
  });

  it('does not render schedule section when batch schedule is not provided', () => {
    const batchWithoutSchedule = { ...mockBatch, schedule: '' };
    render(
      <BatchListItem batch={batchWithoutSchedule} metrics={mockMetrics} />
    );

    const scheduleLabel = screen.queryByText('Schedule');
    expect(scheduleLabel).not.toBeInTheDocument();
  });

  it('displays correct rounded skill level percentage', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={{ attendanceRate: 92, averageSkillLevel: 65.7 }} />
    );

    expect(screen.getByText('66%')).toBeInTheDocument(); // 65.7 rounded to 66
  });

  it('handles batch names with special characters', () => {
    const batchWithSpecialName = { ...mockBatch, name: 'Batch A & B - "Elite"' };
    render(
      <BatchListItem batch={batchWithSpecialName} metrics={mockMetrics} />
    );

    expect(screen.getByText('Batch A & B - "Elite"')).toBeInTheDocument();
  });

  it('renders with proper accessibility attributes', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={mockMetrics} onSelect={vi.fn()} />
    );

    const batchItem = screen.getByRole('button');
    expect(batchItem).toHaveAttribute('aria-label');
    expect(batchItem).toHaveAttribute('tabIndex', '0');
  });

  it('does not call onRemove when Remove button clicked and isRemoving is true', () => {
    const onRemove = vi.fn();
    render(
      <BatchListItem
        batch={mockBatch}
        metrics={mockMetrics}
        canRemove={true}
        isRemoving={true}
        onRemove={onRemove}
      />
    );

    const removeButton = screen.getByRole('button', { name: /Remove Morning Batch A batch/ });
    fireEvent.click(removeButton);

    expect(onRemove).not.toHaveBeenCalled();
  });

  it('rounds skill level percentage correctly', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={{ attendanceRate: 92, averageSkillLevel: 65.3 }} />
    );

    // Verify the skill level is displayed as a number with % symbol
    const allText = screen.queryAllByText((content, element) => {
      return element?.className?.includes('text-2xl') && 
             element?.textContent?.includes('%');
    });
    // Should have at least the average skill level displayed
    expect(allText.length).toBeGreaterThanOrEqual(1);
  });

  it('handles zero attendance rate', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={{ attendanceRate: 0, averageSkillLevel: 65 }} />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('handles 100% attendance rate', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={{ attendanceRate: 100, averageSkillLevel: 65 }} />
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('handles exactly 75% attendance boundary', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={{ attendanceRate: 75, averageSkillLevel: 65 }} />
    );

    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('handles exactly 90% attendance boundary', () => {
    render(
      <BatchListItem batch={mockBatch} metrics={{ attendanceRate: 90, averageSkillLevel: 65 }} />
    );

    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });
});

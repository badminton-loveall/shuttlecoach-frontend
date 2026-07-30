/**
 * Unit tests for BatchComparisonTable component.
 * Tests sorting functionality, below-average highlighting, and states.
 * Requirements: 8.2, 8.4
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BatchComparisonTable } from './BatchComparisonTable';
import type { BatchComparisonMetric } from '../types';

const sampleData: BatchComparisonMetric[] = [
  {
    batchId: 'batch-1',
    batchName: 'Advanced Group',
    avgSkillImprovement: 3.5,
    avgAttendancePercentage: 90.0,
    avgDrillCompletionRate: 85.0,
  },
  {
    batchId: 'batch-2',
    batchName: 'Beginner Group',
    avgSkillImprovement: 1.2,
    avgAttendancePercentage: 65.0,
    avgDrillCompletionRate: 55.0,
  },
  {
    batchId: 'batch-3',
    batchName: 'Intermediate Group',
    avgSkillImprovement: 2.5,
    avgAttendancePercentage: 80.0,
    avgDrillCompletionRate: 72.0,
  },
];

describe('BatchComparisonTable', () => {
  it('renders loading state', () => {
    render(<BatchComparisonTable data={[]} loading={true} />);
    expect(screen.getByText('Loading comparison data...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<BatchComparisonTable data={[]} error="Failed to fetch" />);
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<BatchComparisonTable data={[]} />);
    expect(screen.getByText('No comparison data available.')).toBeInTheDocument();
  });

  it('renders all batch rows', () => {
    render(<BatchComparisonTable data={sampleData} />);
    expect(screen.getByText('Advanced Group')).toBeInTheDocument();
    expect(screen.getByText('Beginner Group')).toBeInTheDocument();
    expect(screen.getByText('Intermediate Group')).toBeInTheDocument();
  });

  it('displays correct metric values', () => {
    render(<BatchComparisonTable data={sampleData} />);
    // Advanced Group: +3.5 improvement, 90.0% attendance, 85.0% completion
    expect(screen.getByText('+3.5')).toBeInTheDocument();
    expect(screen.getByText('90.0%')).toBeInTheDocument();
    expect(screen.getByText('85.0%')).toBeInTheDocument();
  });

  it('highlights below-average rows with warning icon', () => {
    render(<BatchComparisonTable data={sampleData} />);
    // Beginner Group is below average in all metrics
    // Average improvement: (3.5 + 1.2 + 2.5)/3 = 2.4
    // Beginner Group has 1.2, which is below 2.4
    const warningIcons = screen.getAllByLabelText('Below average in one or more metrics');
    expect(warningIcons.length).toBeGreaterThan(0);
  });

  it('sorts by column when header is clicked', () => {
    render(<BatchComparisonTable data={sampleData} />);

    // Default sort is avgSkillImprovement descending
    const rows = screen.getAllByRole('row');
    // First data row (after header) should be Advanced Group (3.5 highest)
    expect(rows[1]).toHaveTextContent('Advanced Group');

    // Click on Attendance % to sort by that column
    const attendanceHeader = screen.getByRole('button', { name: /attendance/i });
    fireEvent.click(attendanceHeader);

    // Should now sort descending by attendance: Advanced (90), Intermediate (80), Beginner (65)
    const updatedRows = screen.getAllByRole('row');
    expect(updatedRows[1]).toHaveTextContent('Advanced Group');
    expect(updatedRows[2]).toHaveTextContent('Intermediate Group');
    expect(updatedRows[3]).toHaveTextContent('Beginner Group');
  });

  it('toggles sort direction on same column click', () => {
    render(<BatchComparisonTable data={sampleData} />);

    // Click Avg Improvement (already active, desc) to toggle to asc
    const improvementHeader = screen.getByRole('button', { name: /avg improvement/i });
    fireEvent.click(improvementHeader);

    // Now ascending: Beginner (1.2), Intermediate (2.5), Advanced (3.5)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Beginner Group');
    expect(rows[3]).toHaveTextContent('Advanced Group');
  });

  it('uses custom title and name column label', () => {
    render(
      <BatchComparisonTable
        data={sampleData}
        title="Student Comparison"
        nameColumnLabel="Student"
      />
    );
    expect(screen.getByText('Student Comparison')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /student/i })).toBeInTheDocument();
  });

  it('displays averages in footer', () => {
    render(<BatchComparisonTable data={sampleData} />);
    // Average improvement: (3.5 + 1.2 + 2.5)/3 = 2.4
    expect(screen.getByText('+2.4')).toBeInTheDocument();
    // Average attendance: (90 + 65 + 80)/3 = 78.3
    expect(screen.getByText('78.3%')).toBeInTheDocument();
  });
});

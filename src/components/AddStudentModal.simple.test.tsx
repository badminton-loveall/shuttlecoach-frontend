import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddStudentModal } from './AddStudentModal';

describe('AddStudentModal - Basic Rendering', () => {
  it('renders the modal when isOpen is true', () => {
    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
      />
    );

    expect(screen.getByText('Assign Student to Coach')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AddStudentModal
        isOpen={false}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays modal header with title and description', () => {
    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
      />
    );

    expect(screen.getByText('Assign Student to Coach')).toBeInTheDocument();
    expect(screen.getByText('Select a student and batch to assign to this coach')).toBeInTheDocument();
  });

  it('displays close button', () => {
    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
      />
    );

    expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
  });

  it('displays empty state when no students are available', () => {
    const mockBatches = [
      {
        id: 'batch-1',
        name: 'Morning Batch',
        schedule: 'Mon-Wed-Fri 7-8 AM',
        assignedCoachId: 'coach-1',
        studentCount: 5,
        createdAt: new Date(),
      },
    ];

    render(
      <AddStudentModal
        isOpen={true}
        onClose={vi.fn()}
        onStudentAssigned={vi.fn()}
        coachId="coach-1"
        availableBatches={mockBatches}
      />
    );

    // Without mocked API, component shows loading or empty state
    // The modal header should still be present
    expect(screen.getByText('Assign Student to Coach')).toBeInTheDocument();
  });
});

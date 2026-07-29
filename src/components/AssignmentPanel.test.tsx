import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AssignmentPanel from './AssignmentPanel';
import type { User, Student, Batch } from '../types';

describe('AssignmentPanel', () => {
  // Mock data
  const mockCoach: User = {
    id: 'coach-001',
    username: 'test_coach',
    role: 'ASSISTANT_COACH',
    name: 'Test Coach',
    email: 'test@coach.com',
    specialization: 'Doubles',
    createdAt: new Date('2026-01-01'),
    lastActive: new Date('2026-01-15'),
  };

  const mockStudents: Student[] = [
    {
      id: 'student-001',
      fullName: 'John Doe',
      dateOfBirth: new Date('2010-01-01'),
      age: 16,
      gender: 'Male',
      contactPhone: '1234567890',
      batchId: 'batch-001',
      assignedCoachId: 'coach-001',
      strengths: [],
      weaknesses: [],
      skillLevel: 'Beginner',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'student-002',
      fullName: 'Jane Smith',
      dateOfBirth: new Date('2011-01-01'),
      age: 15,
      gender: 'Female',
      contactPhone: '0987654321',
      batchId: 'batch-001',
      assignedCoachId: 'coach-001',
      strengths: [],
      weaknesses: [],
      skillLevel: 'Intermediate',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'student-003',
      fullName: 'Bob Wilson',
      dateOfBirth: new Date('2012-01-01'),
      age: 14,
      gender: 'Male',
      contactPhone: '1112223333',
      strengths: [],
      weaknesses: [],
      skillLevel: 'Advanced',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const mockBatches: Batch[] = [
    {
      id: 'batch-001',
      name: 'Morning Batch',
      schedule: 'Mon/Wed/Fri 6-7 AM',
      assignedCoachId: 'coach-001',
      studentCount: 2,
      createdAt: new Date('2026-01-01'),
    },
    {
      id: 'batch-002',
      name: 'Evening Batch',
      schedule: 'Tue/Thu 5-6 PM',
      studentCount: 0,
      createdAt: new Date('2026-01-01'),
    },
  ];

  const mockOnAssignmentChange = vi.fn();

  it('renders empty state when no coach is selected', () => {
    render(
      <AssignmentPanel
        selectedCoach={null}
        students={mockStudents}
        batches={mockBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    expect(screen.getByText('Select a coach to manage assignments')).toBeInTheDocument();
  });

  it('renders assignment form when coach is selected', () => {
    render(
      <AssignmentPanel
        selectedCoach={mockCoach}
        students={mockStudents}
        batches={mockBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    expect(screen.getByText(`Assignments for ${mockCoach.name}`)).toBeInTheDocument();
    expect(screen.getByText('Assign to Batch')).toBeInTheDocument();
    expect(screen.getByText('Assign Individual')).toBeInTheDocument();
  });

  it('displays current batch assignments', () => {
    render(
      <AssignmentPanel
        selectedCoach={mockCoach}
        students={mockStudents}
        batches={mockBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    expect(screen.getByText('Morning Batch')).toBeInTheDocument();
    expect(screen.getByText('Mon/Wed/Fri 6-7 AM • 2 students')).toBeInTheDocument();
  });

  it('displays current individual student assignments', () => {
    render(
      <AssignmentPanel
        selectedCoach={mockCoach}
        students={mockStudents}
        batches={mockBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    // Both students are assigned via batch-001
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('assigns coach to batch', () => {
    render(
      <AssignmentPanel
        selectedCoach={mockCoach}
        students={mockStudents}
        batches={mockBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    // Select unassigned batch (first combobox)
    const selects = screen.getAllByRole('combobox');
    const batchSelect = selects[0];
    fireEvent.change(batchSelect, { target: { value: 'batch-002' } });

    // Click assign button
    const assignButtons = screen.getAllByText('Assign');
    fireEvent.click(assignButtons[0]); // First assign button is for batches

    expect(mockOnAssignmentChange).toHaveBeenCalled();
    const call = mockOnAssignmentChange.mock.calls[0];
    const updatedBatches = call[1];
    
    // Check that batch-002 is now assigned to the coach
    const assignedBatch = updatedBatches.find((b: Batch) => b.id === 'batch-002');
    expect(assignedBatch?.assignedCoachId).toBe(mockCoach.id);
  });

  it('assigns coach to individual student', () => {
    render(
      <AssignmentPanel
        selectedCoach={mockCoach}
        students={mockStudents}
        batches={mockBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    // Select unassigned student
    const studentSelect = screen.getAllByRole('combobox')[1]; // Second select is for students
    fireEvent.change(studentSelect, { target: { value: 'student-003' } });

    // Click assign button
    const assignButtons = screen.getAllByText('Assign');
    fireEvent.click(assignButtons[1]); // Second assign button is for students

    expect(mockOnAssignmentChange).toHaveBeenCalled();
    const call = mockOnAssignmentChange.mock.calls[0];
    const updatedStudents = call[0];
    
    // Check that student-003 is now assigned to the coach
    const assignedStudent = updatedStudents.find((s: Student) => s.id === 'student-003');
    expect(assignedStudent?.assignedCoachId).toBe(mockCoach.id);
  });

  it('unassigns coach from batch', () => {
    render(
      <AssignmentPanel
        selectedCoach={mockCoach}
        students={mockStudents}
        batches={mockBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    // Find unassign buttons in the assigned batches section
    const unassignButtons = screen.getAllByText('Delete');
    
    // Click first unassign button (for batch)
    fireEvent.click(unassignButtons[0]);

    expect(mockOnAssignmentChange).toHaveBeenCalled();
    const call = mockOnAssignmentChange.mock.calls[0];
    const updatedBatches = call[1];
    const updatedStudents = call[0];
    
    // Check that batch-001 is now unassigned
    const unassignedBatch = updatedBatches.find((b: Batch) => b.id === 'batch-001');
    expect(unassignedBatch?.assignedCoachId).toBeUndefined();
    
    // Check that students in batch-001 are also unassigned
    const studentsInBatch = updatedStudents.filter((s: Student) => s.batchId === 'batch-001');
    studentsInBatch.forEach((student: Student) => {
      expect(student.assignedCoachId).toBeUndefined();
    });
  });

  it('unassigns coach from individual student', () => {
    render(
      <AssignmentPanel
        selectedCoach={mockCoach}
        students={mockStudents}
        batches={mockBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    // Find all unassign buttons
    const unassignButtons = screen.getAllByText('Delete');
    
    // Click unassign button for a student (skip the first one which is for batch)
    fireEvent.click(unassignButtons[1]);

    expect(mockOnAssignmentChange).toHaveBeenCalled();
    const call = mockOnAssignmentChange.mock.calls[0];
    const updatedStudents = call[0];
    
    // Check that the student is now unassigned
    const unassignedStudent = updatedStudents.find((s: Student) => s.id === 'student-001');
    expect(unassignedStudent?.assignedCoachId).toBeUndefined();
  });

  it('batch assignment updates all students in that batch', () => {
    // Create fresh data with unassigned batch
    const unassignedBatch: Batch = {
      id: 'batch-003',
      name: 'Test Batch',
      schedule: 'Daily',
      studentCount: 2,
      createdAt: new Date('2026-01-01'),
    };

    const studentsInBatch: Student[] = [
      {
        id: 'student-004',
        fullName: 'Alice Cooper',
        dateOfBirth: new Date('2010-01-01'),
        age: 16,
        gender: 'Female',
        contactPhone: '1234567890',
        batchId: 'batch-003',
        strengths: [],
        weaknesses: [],
        skillLevel: 'Beginner',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
      {
        id: 'student-005',
        fullName: 'Charlie Brown',
        dateOfBirth: new Date('2011-01-01'),
        age: 15,
        gender: 'Male',
        contactPhone: '0987654321',
        batchId: 'batch-003',
        strengths: [],
        weaknesses: [],
        skillLevel: 'Intermediate',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
    ];

    render(
      <AssignmentPanel
        selectedCoach={mockCoach}
        students={studentsInBatch}
        batches={[unassignedBatch]}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    // Select the batch (first combobox)
    const selects = screen.getAllByRole('combobox');
    const batchSelect = selects[0];
    fireEvent.change(batchSelect, { target: { value: 'batch-003' } });

    // Click assign button
    const assignButton = screen.getAllByText('Assign')[0];
    fireEvent.click(assignButton);

    expect(mockOnAssignmentChange).toHaveBeenCalled();
    const call = mockOnAssignmentChange.mock.calls[0];
    const updatedStudents = call[0];
    
    // Check that ALL students in batch-003 are now assigned to the coach
    const assignedStudents = updatedStudents.filter((s: Student) => s.batchId === 'batch-003');
    expect(assignedStudents).toHaveLength(2);
    assignedStudents.forEach((student: Student) => {
      expect(student.assignedCoachId).toBe(mockCoach.id);
    });
  });

  it('shows "no assignments" message when coach has no assignments', () => {
    const unassignedCoach: User = {
      ...mockCoach,
      id: 'coach-002',
    };

    render(
      <AssignmentPanel
        selectedCoach={unassignedCoach}
        students={mockStudents}
        batches={mockBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    expect(screen.getByText('No batches assigned')).toBeInTheDocument();
    expect(screen.getByText('No students assigned')).toBeInTheDocument();
  });

  it('disables assign button when no batch is selected', () => {
    render(
      <AssignmentPanel
        selectedCoach={mockCoach}
        students={mockStudents}
        batches={mockBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    const assignButtons = screen.getAllByText('Assign');
    const batchAssignButton = assignButtons[0];
    
    expect(batchAssignButton).toBeDisabled();
  });

  it('disables assign button when no student is selected', () => {
    render(
      <AssignmentPanel
        selectedCoach={mockCoach}
        students={mockStudents}
        batches={mockBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    const assignButtons = screen.getAllByText('Assign');
    const studentAssignButton = assignButtons[1];
    
    expect(studentAssignButton).toBeDisabled();
  });

  it('shows message when all batches are assigned', () => {
    const allAssignedBatches: Batch[] = mockBatches.map((batch) => ({
      ...batch,
      assignedCoachId: 'some-coach-id',
    }));

    render(
      <AssignmentPanel
        selectedCoach={mockCoach}
        students={mockStudents}
        batches={allAssignedBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    // When all batches are assigned, the badge shows "0 available"
    expect(screen.getByText('0 available')).toBeInTheDocument();
  });

  it('shows message when all students are assigned', () => {
    const allAssignedStudents: Student[] = mockStudents.map((student) => ({
      ...student,
      assignedCoachId: 'some-coach-id',
    }));

    render(
      <AssignmentPanel
        selectedCoach={mockCoach}
        students={allAssignedStudents}
        batches={mockBatches}
        onAssignmentChange={mockOnAssignmentChange}
      />
    );

    // When all students are assigned, the badge shows "0 available" for the student section
    const badges = screen.getAllByText('0 available');
    expect(badges.length).toBeGreaterThan(0);
  });
});

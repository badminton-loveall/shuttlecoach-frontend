import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentAttendanceRow } from './StudentAttendanceRow';
import type { Student } from '../../types';

const mockStudent: Student = {
  id: 'student-1',
  fullName: 'Rahul Sharma',
  dateOfBirth: new Date('2010-05-15'),
  age: 14,
  gender: 'Male',
  contactPhone: '9876543210',
  strengths: [],
  weaknesses: [],
  skillLevel: 'Intermediate',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('StudentAttendanceRow', () => {
  it('renders student full name', () => {
    render(
      <StudentAttendanceRow student={mockStudent} status={undefined} onToggle={vi.fn()} />
    );
    expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
  });

  it('renders Present and Absent toggle buttons', () => {
    render(
      <StudentAttendanceRow student={mockStudent} status={undefined} onToggle={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /mark rahul sharma present/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark rahul sharma absent/i })).toBeInTheDocument();
  });

  it('calls onToggle with PRESENT when P button is clicked', () => {
    const onToggle = vi.fn();
    render(
      <StudentAttendanceRow student={mockStudent} status={undefined} onToggle={onToggle} />
    );
    fireEvent.click(screen.getByRole('button', { name: /mark rahul sharma present/i }));
    expect(onToggle).toHaveBeenCalledWith('student-1', 'PRESENT');
  });

  it('calls onToggle with ABSENT when A button is clicked', () => {
    const onToggle = vi.fn();
    render(
      <StudentAttendanceRow student={mockStudent} status={undefined} onToggle={onToggle} />
    );
    fireEvent.click(screen.getByRole('button', { name: /mark rahul sharma absent/i }));
    expect(onToggle).toHaveBeenCalledWith('student-1', 'ABSENT');
  });

  it('sets aria-pressed=true on the active Present button', () => {
    render(
      <StudentAttendanceRow student={mockStudent} status="PRESENT" onToggle={vi.fn()} />
    );
    const presentBtn = screen.getByRole('button', { name: /mark rahul sharma present/i });
    const absentBtn = screen.getByRole('button', { name: /mark rahul sharma absent/i });
    expect(presentBtn).toHaveAttribute('aria-pressed', 'true');
    expect(absentBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('sets aria-pressed=true on the active Absent button', () => {
    render(
      <StudentAttendanceRow student={mockStudent} status="ABSENT" onToggle={vi.fn()} />
    );
    const presentBtn = screen.getByRole('button', { name: /mark rahul sharma present/i });
    const absentBtn = screen.getByRole('button', { name: /mark rahul sharma absent/i });
    expect(presentBtn).toHaveAttribute('aria-pressed', 'false');
    expect(absentBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders both buttons with aria-pressed=false when no status is set', () => {
    render(
      <StudentAttendanceRow student={mockStudent} status={undefined} onToggle={vi.fn()} />
    );
    const presentBtn = screen.getByRole('button', { name: /mark rahul sharma present/i });
    const absentBtn = screen.getByRole('button', { name: /mark rahul sharma absent/i });
    expect(presentBtn).toHaveAttribute('aria-pressed', 'false');
    expect(absentBtn).toHaveAttribute('aria-pressed', 'false');
  });
});

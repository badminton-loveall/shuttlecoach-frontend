import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StudentCard } from './StudentCard';
import type { Student } from '../types';

describe('StudentCard - Review Reminder', () => {
  const mockStudent: Student = {
    id: 'student-001',
    fullName: 'John Doe',
    dateOfBirth: new Date('2010-05-15'),
    age: 14,
    gender: 'Male',
    contactPhone: '1234567890',
    guardianName: 'Jane Doe',
    guardianPhone: '0987654321',
    baidNumber: 'BAID-001',
    batchId: 'batch-001',
    assignedCoachId: 'coach-001',
    profilePhoto: undefined,
    height: 160,
    weight: 50,
    bmi: 19.5,
    bloodGroup: 'O+',
    medicalConditions: undefined,
    emergencyContact: '0987654321',
    strengths: ['Speed'],
    weaknesses: ['Power'],
    coachFeedback: 'Good player',
    skillLevel: 'Intermediate',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-15'),
  };

  it('does not display review badge when student is not due', () => {
    render(<StudentCard student={mockStudent} isDueForReview={false} daysOverdue={0} />);
    
    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
  });

  it('displays review badge when student is due for review', () => {
    render(<StudentCard student={mockStudent} isDueForReview={true} daysOverdue={5} />);
    
    expect(screen.getByText('5 days overdue')).toBeInTheDocument();
  });

  it('displays "Never assessed" for students with no assessment', () => {
    render(<StudentCard student={mockStudent} isDueForReview={true} daysOverdue={9999} />);
    
    expect(screen.getByText('Never assessed')).toBeInTheDocument();
  });

  it('displays review badge with warning icon', () => {
    render(<StudentCard student={mockStudent} isDueForReview={true} daysOverdue={10} />);
    
    const badge = screen.getByText('10 days overdue').closest('.student-card__due-badge');
    expect(badge).toBeInTheDocument();
    expect(badge?.querySelector('.student-card__due-icon')).toHaveTextContent('⚠️');
  });

  it('includes tooltip with overdue information', () => {
    render(<StudentCard student={mockStudent} isDueForReview={true} daysOverdue={15} />);
    
    const badge = screen.getByText('15 days overdue').closest('.student-card__due-badge');
    expect(badge).toHaveAttribute('title', 'Assessment overdue: 15 days overdue');
  });

  it('renders all student information alongside review badge', () => {
    render(<StudentCard student={mockStudent} isDueForReview={true} daysOverdue={7} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Unknown batch')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('7 days overdue')).toBeInTheDocument();
  });

  it('does not show review badge by default when props not provided', () => {
    render(<StudentCard student={mockStudent} />);
    
    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Never assessed/i)).not.toBeInTheDocument();
  });
});

describe('StudentCard - Batch Name Display', () => {
  const mockStudent: Student = {
    id: 'student-001',
    fullName: 'John Doe',
    dateOfBirth: new Date('2010-05-15'),
    age: 14,
    gender: 'Male',
    contactPhone: '1234567890',
    guardianName: 'Jane Doe',
    guardianPhone: '0987654321',
    baidNumber: 'BAID-001',
    batchId: 'batch-001',
    assignedCoachId: 'coach-001',
    profilePhoto: undefined,
    height: 160,
    weight: 50,
    bmi: 19.5,
    bloodGroup: 'O+',
    medicalConditions: undefined,
    emergencyContact: '0987654321',
    strengths: ['Speed'],
    weaknesses: ['Power'],
    coachFeedback: 'Good player',
    skillLevel: 'Intermediate',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-15'),
  };

  it('displays batchName when provided', () => {
    render(<StudentCard student={mockStudent} batchName="Morning Beginners" />);
    
    expect(screen.getByText('Morning Beginners')).toBeInTheDocument();
    expect(screen.queryByText('Unknown batch')).not.toBeInTheDocument();
  });

  it('displays "Unknown batch" when batchId exists but no batchName provided', () => {
    render(<StudentCard student={mockStudent} />);
    
    expect(screen.getByText('Unknown batch')).toBeInTheDocument();
  });

  it('omits batch label entirely when no batchId is assigned', () => {
    const studentNoBatch = { ...mockStudent, batchId: undefined };
    render(<StudentCard student={studentNoBatch} />);
    
    expect(screen.queryByText('Unknown batch')).not.toBeInTheDocument();
    expect(screen.queryByRole('paragraph', { name: /batch/i })).not.toBeInTheDocument();
  });
});

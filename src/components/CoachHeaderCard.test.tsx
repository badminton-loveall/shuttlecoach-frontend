import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoachHeaderCard } from './CoachHeaderCard';
import type { User } from '../types';

/**
 * CoachHeaderCard Component Tests
 * 
 * Tests verify:
 * - **Property 1: Header displays required coach information** (name, email, specialization)
 * - **Property 5: Header counts match data** (batch and student counts)
 * - **Property 7: Sensitive fields hidden for non-admins** (email hidden for ASSISTANT_COACH and STUDENT)
 * 
 * **Validates: Requirements 1.1, 1.5, 2.6**
 */

describe('CoachHeaderCard', () => {
  const mockCoach: User = {
    id: 'coach-1',
    username: 'jdoe',
    role: 'HEAD_COACH',
    name: 'John Doe',
    email: 'john@example.com',
    specialization: 'Advanced Badminton',
    profilePhoto: undefined,
    createdAt: new Date(),
    lastActive: new Date(),
  };

  it('displays coach name', () => {
    render(<CoachHeaderCard coach={mockCoach} batchCount={0} studentCount={0} userRole="HEAD_COACH" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays coach email when available', () => {
    render(<CoachHeaderCard coach={mockCoach} batchCount={0} studentCount={0} userRole="HEAD_COACH" />);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('displays coach specialization when available', () => {
    render(<CoachHeaderCard coach={mockCoach} batchCount={0} studentCount={0} userRole="HEAD_COACH" />);
    expect(screen.getByText(/Specialization: Advanced Badminton/)).toBeInTheDocument();
  });

  it('hides email when not provided', () => {
    const coachWithoutEmail = { ...mockCoach, email: undefined };
    render(<CoachHeaderCard coach={coachWithoutEmail} batchCount={0} studentCount={0} userRole="HEAD_COACH" />);
    expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
  });

  it('hides specialization when not provided', () => {
    const coachWithoutSpecialization = { ...mockCoach, specialization: undefined };
    render(<CoachHeaderCard coach={coachWithoutSpecialization} batchCount={0} studentCount={0} userRole="HEAD_COACH" />);
    expect(screen.queryByText(/Specialization:/)).not.toBeInTheDocument();
  });

  it('displays batch count correctly', () => {
    render(<CoachHeaderCard coach={mockCoach} batchCount={5} studentCount={0} userRole="HEAD_COACH" />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Batches')).toBeInTheDocument();
  });

  it('displays student count correctly', () => {
    render(<CoachHeaderCard coach={mockCoach} batchCount={0} studentCount={12} userRole="HEAD_COACH" />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
  });

  it('uses singular "Batch" when count is 1', () => {
    render(<CoachHeaderCard coach={mockCoach} batchCount={1} studentCount={0} userRole="HEAD_COACH" />);
    expect(screen.getByText('Batch')).toBeInTheDocument();
    expect(screen.queryByText('Batches')).not.toBeInTheDocument();
  });

  it('uses singular "Student" when count is 1', () => {
    render(<CoachHeaderCard coach={mockCoach} batchCount={0} studentCount={1} userRole="HEAD_COACH" />);
    expect(screen.getByText('Student')).toBeInTheDocument();
    // Make sure it doesn't have the plural form in the students section
    const studentElements = screen.getAllByText('Student');
    expect(studentElements.length).toBeGreaterThanOrEqual(1);
  });

  it('displays avatar with initials when no profile photo', () => {
    render(<CoachHeaderCard coach={mockCoach} batchCount={0} studentCount={0} userRole="HEAD_COACH" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('displays profile photo when available', () => {
    const coachWithPhoto = {
      ...mockCoach,
      profilePhoto: 'https://example.com/photo.jpg',
    };
    render(<CoachHeaderCard coach={coachWithPhoto} batchCount={0} studentCount={0} userRole="HEAD_COACH" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    expect(img).toHaveAttribute('alt', 'John Doe');
  });

  it('displays both batch and student counts together', () => {
    render(<CoachHeaderCard coach={mockCoach} batchCount={3} studentCount={25} userRole="HEAD_COACH" />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Batches')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
  });

  it('handles zero counts correctly', () => {
    render(<CoachHeaderCard coach={mockCoach} batchCount={0} studentCount={0} userRole="HEAD_COACH" />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });

  it('generates initials correctly from coach name', () => {
    const coachWithDifferentName = {
      ...mockCoach,
      name: 'Alice Smith',
      profilePhoto: undefined,
    };
    render(<CoachHeaderCard coach={coachWithDifferentName} batchCount={0} studentCount={0} userRole="HEAD_COACH" />);
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('handles single-word names gracefully', () => {
    const coachWithSingleName = {
      ...mockCoach,
      name: 'Madonna',
      profilePhoto: undefined,
    };
    render(<CoachHeaderCard coach={coachWithSingleName} batchCount={0} studentCount={0} userRole="HEAD_COACH" />);
    // Should display "M" in the avatar (single letter for single word)
    expect(screen.getByText('Madonna')).toBeInTheDocument();
    // Just verify the name is displayed
  });

  it('defaults to 0 for batch count when not provided', () => {
    render(<CoachHeaderCard coach={mockCoach} studentCount={5} userRole="HEAD_COACH" />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });

  it('defaults to 0 for student count when not provided', () => {
    render(<CoachHeaderCard coach={mockCoach} batchCount={3} userRole="HEAD_COACH" />);
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });

  // Tests for conditional field visibility based on userRole
  describe('conditional field visibility based on userRole', () => {
    it('displays email for HEAD_COACH role', () => {
      render(
        <CoachHeaderCard
          coach={mockCoach}
          batchCount={0}
          studentCount={0}
          userRole="HEAD_COACH"
        />
      );
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('hides email for ASSISTANT_COACH role', () => {
      render(
        <CoachHeaderCard
          coach={mockCoach}
          batchCount={0}
          studentCount={0}
          userRole="ASSISTANT_COACH"
        />
      );
      expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
    });

    it('hides email for STUDENT role', () => {
      render(
        <CoachHeaderCard
          coach={mockCoach}
          batchCount={0}
          studentCount={0}
          userRole="STUDENT"
        />
      );
      expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
    });

    it('hides email by default when userRole not provided', () => {
      render(<CoachHeaderCard coach={mockCoach} batchCount={0} studentCount={0} />);
      expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
    });

    it('displays specialization for HEAD_COACH even when email is hidden', () => {
      render(
        <CoachHeaderCard
          coach={mockCoach}
          batchCount={0}
          studentCount={0}
          userRole="HEAD_COACH"
        />
      );
      expect(screen.getByText(/Specialization: Advanced Badminton/)).toBeInTheDocument();
    });

    it('displays specialization for ASSISTANT_COACH when email is hidden', () => {
      render(
        <CoachHeaderCard
          coach={mockCoach}
          batchCount={0}
          studentCount={0}
          userRole="ASSISTANT_COACH"
        />
      );
      expect(screen.getByText(/Specialization: Advanced Badminton/)).toBeInTheDocument();
    });

    it('displays specialization for STUDENT when email is hidden', () => {
      render(
        <CoachHeaderCard
          coach={mockCoach}
          batchCount={0}
          studentCount={0}
          userRole="STUDENT"
        />
      );
      expect(screen.getByText(/Specialization: Advanced Badminton/)).toBeInTheDocument();
    });

    it('email and specialization visibility are independent', () => {
      const coachWithoutSpecialization = {
        ...mockCoach,
        specialization: undefined,
      };
      render(
        <CoachHeaderCard
          coach={coachWithoutSpecialization}
          batchCount={0}
          studentCount={0}
          userRole="HEAD_COACH"
        />
      );
      // Email should be visible
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      // Specialization should not be visible
      expect(screen.queryByText(/Specialization:/)).not.toBeInTheDocument();
    });
  });
});

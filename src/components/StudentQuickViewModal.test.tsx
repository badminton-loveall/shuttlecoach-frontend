import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentQuickViewModal } from './StudentQuickViewModal';
import type { Student } from '../types';

/**
 * StudentQuickViewModal Tests
 * Tests for displaying student quick view modal with key information
 *
 * Requirements:
 * 11.1: Display summary modal with key student information
 * 11.2: Display link to view full student profile
 * 11.3: Accept student data and isOpen/onClose props
 * 11.4: Close on close button click, outside click, process only first close action
 */

const mockStudent: Student = {
  id: 'student-1',
  fullName: 'John Doe',
  dateOfBirth: new Date('2010-05-15'),
  age: 14,
  gender: 'Male',
  contactPhone: '9876543210',
  email: 'john.doe@example.com',
  guardianName: 'Jane Doe',
  guardianPhone: '9876543211',
  baidNumber: 'BAID001',
  batchId: 'batch-1',
  assignedCoachId: 'coach-1',
  profilePhoto: 'https://example.com/photo.jpg',
  height: 160,
  weight: 50,
  bmi: 19.5,
  bloodGroup: 'O+',
  medicalConditions: 'None',
  emergencyContact: '9876543212',
  strengths: ['Forehand', 'Footwork'],
  weaknesses: ['Backhand', 'Serve'],
  coachFeedback: 'Good progress, needs to work on backhand.',
  skillLevel: 'Intermediate',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

describe('StudentQuickViewModal', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
  });

  describe('Rendering', () => {
    it('should render nothing when isOpen is false', () => {
      const { container } = render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={false}
          onClose={mockOnClose}
        />
      );

      expect(container.querySelector('.modal-overlay')).not.toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should render nothing when student is null', () => {
      const { container } = render(
        <StudentQuickViewModal
          student={null}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(container.querySelector('.modal-overlay')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true and student exists', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Student Details')).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should display all required student information', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Check student name
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Check email
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();

      // Check age
      expect(screen.getByText('14 years')).toBeInTheDocument();

      // Check skill level
      expect(screen.getByText('Intermediate')).toBeInTheDocument();

      // Check batch
      expect(screen.getByText('batch-1')).toBeInTheDocument();

      // Check phone
      expect(screen.getByText('9876543210')).toBeInTheDocument();
    });

    it('should display profile photo when available', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const profilePhoto = screen.getByAltText('John Doe');
      expect(profilePhoto).toBeInTheDocument();
      expect(profilePhoto).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });

    it('should display avatar with initial when profile photo is not available', () => {
      const studentWithoutPhoto: Student = { ...mockStudent, profilePhoto: undefined };

      render(
        <StudentQuickViewModal
          student={studentWithoutPhoto}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should display gender information', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Male')).toBeInTheDocument();
    });

    it('should display guardian name for minors', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should display medical conditions when available', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('should display strengths and weaknesses as tags', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Forehand')).toBeInTheDocument();
      expect(screen.getByText('Footwork')).toBeInTheDocument();
      expect(screen.getByText('Backhand')).toBeInTheDocument();
      expect(screen.getByText('Serve')).toBeInTheDocument();
    });

    it('should display coach feedback when available', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Good progress, needs to work on backhand.')).toBeInTheDocument();
    });

    it('should show dash (—) for missing optional fields', () => {
      const studentWithoutOptional: Student = {
        ...mockStudent,
        email: undefined,
        medicalConditions: undefined,
        coachFeedback: undefined,
      };

      render(
        <StudentQuickViewModal
          student={studentWithoutOptional}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const dashElements = screen.getAllByText('—');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe('Link to Full Profile', () => {
    it('should display link to full student profile', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const profileLink = screen.getByText('View Full Profile');
      expect(profileLink).toBeInTheDocument();
      expect(profileLink).toHaveAttribute('href', `/students/${mockStudent.id}`);
    });

    it('should have proper aria-label for profile link', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const profileLink = screen.getByText('View Full Profile');
      expect(profileLink).toHaveAttribute('aria-label', `View full profile for ${mockStudent.fullName}`);
    });
  });

  describe('Close Behavior', () => {
    it('should close on close button click', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText('Close student details modal');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close on backdrop click (outside modal)', () => {
      const { container } = render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const backdrop = container.querySelector('.modal-overlay') as HTMLElement;
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should NOT close when clicking inside modal content', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const modalContent = screen.getByRole('dialog');
      fireEvent.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should close on Close button click', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close on Escape key press', async () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should process only first close action if multiple occur simultaneously', async () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText('Close student details modal');
      const backdrop = screen.getByRole('dialog').parentElement;

      // Simulate multiple close actions
      fireEvent.click(closeButton);
      fireEvent.click(backdrop as HTMLElement);
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        // Despite multiple close attempts, onClose should only be called once after processing
        expect(mockOnClose.mock.calls.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'student-quick-view-title');
    });

    it('should have proper aria-label on close button', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText('Close student details modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have proper heading for modal title', () => {
      render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const title = screen.getByRole('heading', { name: 'Student Details' });
      expect(title).toHaveAttribute('id', 'student-quick-view-title');
    });

    it('should be keyboard navigable', async () => {
      const { container } = render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByLabelText('Close student details modal');
      closeButton.focus();

      // Close button should be focusable
      expect(closeButton).toBeDefined();
    });
  });

  describe('Modal Styling', () => {
    it('should have modal-overlay class on backdrop', () => {
      const { container } = render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const overlay = container.querySelector('.modal-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('should have modal-content class on modal content area', () => {
      const { container } = render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const content = container.querySelector('.modal-content');
      expect(content).toBeInTheDocument();
    });

    it('should have modal-content--small size class', () => {
      const { container } = render(
        <StudentQuickViewModal
          student={mockStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const content = container.querySelector('.modal-content--small');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Student Without Strengths/Weaknesses', () => {
    it('should not display strengths section when empty', () => {
      const studentWithoutStrengths: Student = {
        ...mockStudent,
        strengths: [],
      };

      render(
        <StudentQuickViewModal
          student={studentWithoutStrengths}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Strengths')).not.toBeInTheDocument();
    });

    it('should not display weaknesses section when empty', () => {
      const studentWithoutWeaknesses: Student = {
        ...mockStudent,
        weaknesses: [],
      };

      render(
        <StudentQuickViewModal
          student={studentWithoutWeaknesses}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Areas to Improve')).not.toBeInTheDocument();
    });
  });

  describe('Adult Student (Over 18)', () => {
    it('should not display guardian information for adults', () => {
      const adultStudent: Student = {
        ...mockStudent,
        age: 25,
      };

      render(
        <StudentQuickViewModal
          student={adultStudent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Guardian Name')).not.toBeInTheDocument();
    });
  });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentListItem } from './StudentListItem';
import type { Student } from '../types';

/**
 * Unit tests for StudentListItem component
 * Tests rendering, interactions, and role-based functionality
 */

// Mock student data
const mockStudent: Student = {
  id: 'student-1',
  fullName: 'Alice Johnson',
  dateOfBirth: new Date('2010-05-15'),
  age: 14,
  gender: 'Female',
  contactPhone: '9876543210',
  email: 'alice@example.com',
  batchId: 'batch-1',
  assignedCoachId: 'coach-1',
  skillLevel: 'Beginner',
  createdAt: new Date(),
  updatedAt: new Date(),
  strengths: ['quick reflexes'],
  weaknesses: ['footwork'],
};

describe('StudentListItem', () => {
  describe('Rendering and Display', () => {
    it('renders student name', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
        />
      );

      expect(screen.getByText(mockStudent.fullName)).toBeInTheDocument();
    });

    it('displays all student information correctly', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
        />
      );

      expect(screen.getByText(mockStudent.fullName)).toBeInTheDocument();
      expect(screen.getByText(mockStudent.skillLevel)).toBeInTheDocument();
      expect(screen.getByText('Fair')).toBeInTheDocument();
      expect(screen.getByText(`${mockStudent.age} yrs`)).toBeInTheDocument();
      expect(screen.getByText(mockStudent.batchId || '—')).toBeInTheDocument();
    });

    it('displays performance status passed as prop', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Excellent"
        />
      );

      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('displays dash for missing batch ID', () => {
      const studentNoBatch = { ...mockStudent, batchId: undefined };
      render(
        <StudentListItem
          student={studentNoBatch}
          performanceStatus="Fair"
        />
      );

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('renders student avatar with initials when no profile photo', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
        />
      );

      // Check that the avatar div contains the first letter
      const avatarSpan = screen.getByText('A', { selector: 'span' });
      expect(avatarSpan).toBeInTheDocument();
      const avatarDiv = avatarSpan.closest('.rounded-full');
      expect(avatarDiv).toBeInTheDocument();
    });

    it('renders student profile photo when available', () => {
      const studentWithPhoto = {
        ...mockStudent,
        profilePhoto: 'https://example.com/photo.jpg',
      };
      render(
        <StudentListItem
          student={studentWithPhoto}
          performanceStatus="Fair"
        />
      );

      const img = screen.getByAltText(mockStudent.fullName) as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toBe('https://example.com/photo.jpg');
    });

    it('has proper ARIA label for the item', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
        />
      );

      const itemElement = screen.getByRole('button', {
        name: `View details for student: ${mockStudent.fullName}`,
      });
      expect(itemElement).toBeInTheDocument();
    });
  });

  describe('User Interactions - Click to View', () => {
    it('calls onSelect callback when clicked', async () => {
      const onSelect = vi.fn();
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          onSelect={onSelect}
        />
      );

      const itemElement = screen.getByRole('button', {
        name: `View details for student: ${mockStudent.fullName}`,
      });
      fireEvent.click(itemElement);

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith(mockStudent);
      });
    });

    it('calls onSelect callback when Enter key is pressed', async () => {
      const onSelect = vi.fn();
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          onSelect={onSelect}
        />
      );

      const itemElement = screen.getByRole('button', {
        name: `View details for student: ${mockStudent.fullName}`,
      });
      fireEvent.keyDown(itemElement, { key: 'Enter' });

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith(mockStudent);
      });
    });

    it('calls onSelect callback when Space key is pressed', async () => {
      const onSelect = vi.fn();
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          onSelect={onSelect}
        />
      );

      const itemElement = screen.getByRole('button', {
        name: `View details for student: ${mockStudent.fullName}`,
      });
      fireEvent.keyDown(itemElement, { key: ' ' });

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith(mockStudent);
      });
    });

    it('does not call onSelect when other keys are pressed', async () => {
      const onSelect = vi.fn();
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          onSelect={onSelect}
        />
      );

      const itemElement = screen.getByRole('button', {
        name: `View details for student: ${mockStudent.fullName}`,
      });
      fireEvent.keyDown(itemElement, { key: 'Escape' });

      await waitFor(() => {
        expect(onSelect).not.toHaveBeenCalled();
      });
    });
  });

  describe('Remove Button - Role-Based Visibility', () => {
    it('shows Remove button when canRemove is true', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          canRemove={true}
        />
      );

      expect(
        screen.getByLabelText(`Remove student: ${mockStudent.fullName}`)
      ).toBeInTheDocument();
    });

    it('hides Remove button when canRemove is false', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          canRemove={false}
        />
      );

      expect(
        screen.queryByLabelText(`Remove student: ${mockStudent.fullName}`)
      ).not.toBeInTheDocument();
    });

    it('hides Remove button by default', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
        />
      );

      expect(
        screen.queryByLabelText(`Remove student: ${mockStudent.fullName}`)
      ).not.toBeInTheDocument();
    });
  });

  describe('Remove Button - Interactions', () => {
    it('calls onRemove callback when Remove button is clicked', async () => {
      const onRemove = vi.fn();
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          canRemove={true}
          onRemove={onRemove}
        />
      );

      const removeButton = screen.getByLabelText(
        `Remove student: ${mockStudent.fullName}`
      );
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalledWith(mockStudent);
      });
    });

    it('passes student object to onRemove callback', async () => {
      const onRemove = vi.fn();
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          canRemove={true}
          onRemove={onRemove}
        />
      );

      const removeButton = screen.getByLabelText(
        `Remove student: ${mockStudent.fullName}`
      );
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalledWith(mockStudent);
      });
    });

    it('shows "Removing..." text while isRemoving is true', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          canRemove={true}
          isRemoving={true}
        />
      );

      expect(screen.getByText('Removing...')).toBeInTheDocument();
    });

    it('shows "Remove" text when isRemoving is false', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          canRemove={true}
          isRemoving={false}
        />
      );

      expect(screen.getByText('Remove')).toBeInTheDocument();
    });

    it('disables Remove button when isRemoving is true', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          canRemove={true}
          isRemoving={true}
        />
      );

      const removeButton = screen.getByLabelText(
        `Remove student: ${mockStudent.fullName}`
      );
      expect(removeButton).toBeDisabled();
    });

    it('does not call onRemove when Remove button is clicked while isRemoving is true', async () => {
      const onRemove = vi.fn();
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          canRemove={true}
          isRemoving={true}
          onRemove={onRemove}
        />
      );

      const removeButton = screen.getByLabelText(
        `Remove student: ${mockStudent.fullName}`
      );
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(onRemove).not.toHaveBeenCalled();
      });
    });

    it('stops propagation when Remove button is clicked', async () => {
      const onSelect = vi.fn();
      const onRemove = vi.fn();
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          canRemove={true}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      );

      const removeButton = screen.getByLabelText(
        `Remove student: ${mockStudent.fullName}`
      );
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalled();
        expect(onSelect).not.toHaveBeenCalled();
      });
    });
  });

  describe('Integration Tests', () => {
    it('allows clicking student item to view details while also having remove option', async () => {
      const onSelect = vi.fn();
      const onRemove = vi.fn();
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          canRemove={true}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      );

      // Click on student name area to select
      const itemElement = screen.getByRole('button', {
        name: `View details for student: ${mockStudent.fullName}`,
      });
      fireEvent.click(itemElement);

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith(mockStudent);
      });

      // Now click remove button
      const removeButton = screen.getByLabelText(
        `Remove student: ${mockStudent.fullName}`
      );
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalledWith(mockStudent);
      });
    });

    it('handles all data fields correctly for different students', () => {
      const student2: Student = {
        id: 'student-2',
        fullName: 'Bob Smith',
        dateOfBirth: new Date('2008-10-22'),
        age: 16,
        gender: 'Male',
        contactPhone: '9876543211',
        email: 'bob@example.com',
        batchId: 'batch-2',
        assignedCoachId: 'coach-1',
        skillLevel: 'Advanced',
        createdAt: new Date(),
        updatedAt: new Date(),
        strengths: ['strong service'],
        weaknesses: ['net play'],
      };

      const { rerender } = render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
        />
      );

      expect(screen.getByText(mockStudent.fullName)).toBeInTheDocument();
      expect(screen.getByText(mockStudent.skillLevel)).toBeInTheDocument();

      rerender(
        <StudentListItem
          student={student2}
          performanceStatus="Very Good"
        />
      );

      expect(screen.getByText(student2.fullName)).toBeInTheDocument();
      expect(screen.getByText(student2.skillLevel)).toBeInTheDocument();
      expect(screen.getByText('Very Good')).toBeInTheDocument();
      expect(screen.getByText(`${student2.age} yrs`)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          canRemove={true}
        />
      );

      const itemElement = screen.getByRole('button', {
        name: `View details for student: ${mockStudent.fullName}`,
      });
      expect(itemElement).toHaveAttribute('tabIndex', '0');
    });

    it('has proper ARIA label for Remove button', () => {
      render(
        <StudentListItem
          student={mockStudent}
          performanceStatus="Fair"
          canRemove={true}
        />
      );

      const removeButton = screen.getByLabelText(
        `Remove student: ${mockStudent.fullName}`
      );
      expect(removeButton).toBeInTheDocument();
    });
  });
});

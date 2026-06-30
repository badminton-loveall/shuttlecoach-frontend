import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PersonalInfoForm } from './PersonalInfoForm';
import type { Student } from '../types';

const createMockStudent = (overrides: Partial<Student> = {}): Student => ({
  id: 'student-1',
  fullName: 'Arjun Verma',
  dateOfBirth: new Date('2010-05-15'),
  age: 14,
  gender: 'Male',
  contactPhone: '9876543210',
  email: 'arjun@example.com',
  guardianName: 'Vikram Verma',
  guardianPhone: '9876543200',
  baidNumber: 'BAID-001',
  batchId: 'batch-1',
  profilePhoto: undefined,
  height: 155,
  weight: 48,
  bmi: 20.0,
  bloodGroup: 'B+',
  medicalConditions: 'None',
  emergencyContact: '9876543211',
  strengths: ['Forehand Clear'],
  weaknesses: ['Backhand Drop'],
  coachFeedback: 'Good progress',
  skillLevel: 'Intermediate',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('PersonalInfoForm', () => {
  describe('Read-only mode', () => {
    it('renders student full name', () => {
      const student = createMockStudent();
      render(<PersonalInfoForm student={student} />);
      expect(screen.getByText('Arjun Verma')).toBeInTheDocument();
    });

    it('renders gender', () => {
      const student = createMockStudent();
      render(<PersonalInfoForm student={student} />);
      expect(screen.getByText('Male')).toBeInTheDocument();
    });

    it('renders contact phone', () => {
      const student = createMockStudent();
      render(<PersonalInfoForm student={student} />);
      expect(screen.getByText('9876543210')).toBeInTheDocument();
    });

    it('displays computed age from DOB', () => {
      const student = createMockStudent({ dateOfBirth: new Date('2010-05-15') });
      render(<PersonalInfoForm student={student} />);
      const ageElement = screen.getByTestId('computed-age');
      expect(ageElement).toBeInTheDocument();
      expect(ageElement.textContent).toMatch(/\d+ years/);
    });

    it('displays computed BMI when height and weight are provided', () => {
      const student = createMockStudent({ height: 155, weight: 48 });
      render(<PersonalInfoForm student={student} />);
      const bmiElement = screen.getByTestId('computed-bmi');
      expect(bmiElement).toBeInTheDocument();
      expect(bmiElement.textContent).toBe('20');
    });

    it('does not show BMI when height or weight is missing', () => {
      const student = createMockStudent({ height: undefined, weight: undefined });
      render(<PersonalInfoForm student={student} />);
      expect(screen.queryByTestId('computed-bmi')).not.toBeInTheDocument();
    });

    it('displays optional fields when present', () => {
      const student = createMockStudent({
        email: 'test@example.com',
        bloodGroup: 'B+',
        guardianName: 'Guardian Test',
      });
      render(<PersonalInfoForm student={student} />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('B+')).toBeInTheDocument();
      expect(screen.getByText('Guardian Test')).toBeInTheDocument();
    });

    it('hides optional fields when absent', () => {
      const student = createMockStudent({
        email: undefined,
        bloodGroup: undefined,
        guardianName: undefined,
      });
      render(<PersonalInfoForm student={student} />);
      expect(screen.queryByText('Email')).not.toBeInTheDocument();
      expect(screen.queryByText('Blood Group')).not.toBeInTheDocument();
      expect(screen.queryByText('Guardian Name')).not.toBeInTheDocument();
    });

    it('uses 2-column grid layout', () => {
      const student = createMockStudent();
      render(<PersonalInfoForm student={student} />);
      const form = screen.getByTestId('personal-info-form');
      const grid = form.querySelector('.form-grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Editing mode', () => {
    it('renders input fields in editing mode', () => {
      const student = createMockStudent();
      render(<PersonalInfoForm student={student} isEditing={true} />);
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument();
    });

    it('pre-fills form values from student data', () => {
      const student = createMockStudent();
      render(<PersonalInfoForm student={student} isEditing={true} />);
      expect(screen.getByLabelText(/full name/i)).toHaveValue('Arjun Verma');
      expect(screen.getByLabelText(/contact phone/i)).toHaveValue('9876543210');
    });

    it('computes age dynamically in editing mode', () => {
      const student = createMockStudent({ dateOfBirth: new Date('2010-05-15') });
      render(<PersonalInfoForm student={student} isEditing={true} />);
      const ageElement = screen.getByTestId('computed-age');
      expect(ageElement).toBeInTheDocument();
      expect(ageElement.textContent).toMatch(/Age: \d+ years/);
    });

    it('computes BMI dynamically when height and weight are present', () => {
      const student = createMockStudent({ height: 170, weight: 65 });
      render(<PersonalInfoForm student={student} isEditing={true} />);
      const bmiElement = screen.getByTestId('computed-bmi');
      expect(bmiElement).toBeInTheDocument();
      // BMI = 65 / (1.7)^2 = 22.5
      expect(bmiElement.textContent).toBe('22.5');
    });

    it('shows guardian fields as required when student is under 18', () => {
      const student = createMockStudent({ dateOfBirth: new Date('2012-01-01') });
      render(<PersonalInfoForm student={student} isEditing={true} />);
      expect(screen.getByText(/required — student is under 18/i)).toBeInTheDocument();
    });

    it('shows guardian fields as optional when student is 18 or older', () => {
      const student = createMockStudent({ dateOfBirth: new Date('2000-01-01') });
      render(<PersonalInfoForm student={student} isEditing={true} />);
      expect(screen.queryByText(/required — student is under 18/i)).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error when full name is empty on submit', () => {
      const student = createMockStudent();
      const onSave = vi.fn();
      render(<PersonalInfoForm student={student} isEditing={true} onSave={onSave} />);

      // Clear the full name field
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: '' } });
      fireEvent.submit(screen.getByTestId('personal-info-form'));

      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('shows error for invalid email format', () => {
      const student = createMockStudent();
      const onSave = vi.fn();
      render(<PersonalInfoForm student={student} isEditing={true} onSave={onSave} />);

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });
      fireEvent.submit(screen.getByTestId('personal-info-form'));

      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('shows error for invalid phone format', () => {
      const student = createMockStudent();
      const onSave = vi.fn();
      render(<PersonalInfoForm student={student} isEditing={true} onSave={onSave} />);

      fireEvent.change(screen.getByLabelText(/contact phone/i), { target: { value: '123' } });
      fireEvent.submit(screen.getByTestId('personal-info-form'));

      expect(screen.getByText('Invalid phone format (10-15 digits)')).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('shows error when guardian name is missing for under-18 student', () => {
      const student = createMockStudent({
        dateOfBirth: new Date('2012-01-01'),
        guardianName: '',
        guardianPhone: '',
      });
      const onSave = vi.fn();
      render(<PersonalInfoForm student={student} isEditing={true} onSave={onSave} />);

      // Clear guardian fields
      fireEvent.change(screen.getByLabelText(/guardian name/i), { target: { value: '' } });
      fireEvent.change(screen.getByLabelText(/guardian phone/i), { target: { value: '' } });
      fireEvent.submit(screen.getByTestId('personal-info-form'));

      expect(
        screen.getByText('Guardian name is required for students under 18')
      ).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('calls onSave with valid data when form is submitted successfully', () => {
      const student = createMockStudent({
        dateOfBirth: new Date('2012-05-15'),
        guardianName: 'Parent Name',
        guardianPhone: '9876543200',
      });
      const onSave = vi.fn();
      render(<PersonalInfoForm student={student} isEditing={true} onSave={onSave} />);

      fireEvent.submit(screen.getByTestId('personal-info-form'));

      expect(onSave).toHaveBeenCalledTimes(1);
      const savedData = onSave.mock.calls[0][0];
      expect(savedData.fullName).toBe('Arjun Verma');
      expect(savedData.gender).toBe('Male');
      expect(savedData.contactPhone).toBe('9876543210');
    });

    it('clears field error when user changes the field value', () => {
      const student = createMockStudent();
      render(<PersonalInfoForm student={student} isEditing={true} onSave={vi.fn()} />);

      // Trigger validation error
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: '' } });
      fireEvent.submit(screen.getByTestId('personal-info-form'));
      expect(screen.getByText('Full name is required')).toBeInTheDocument();

      // Fix the field
      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'New Name' } });
      expect(screen.queryByText('Full name is required')).not.toBeInTheDocument();
    });
  });

  describe('Cancel action', () => {
    it('calls onCancel when cancel button is clicked', () => {
      const student = createMockStudent();
      const onCancel = vi.fn();
      render(
        <PersonalInfoForm student={student} isEditing={true} onCancel={onCancel} onSave={vi.fn()} />
      );

      fireEvent.click(screen.getByText('Cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not render cancel button when onCancel is not provided', () => {
      const student = createMockStudent();
      render(<PersonalInfoForm student={student} isEditing={true} onSave={vi.fn()} />);
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });
});

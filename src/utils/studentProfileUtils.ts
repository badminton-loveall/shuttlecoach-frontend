/**
 * Student Profile Utility Functions
 * Provides helpers for form validation, error classification, permission checks,
 * and changed-field computation for the Student Profile CRUD feature.
 *
 * Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 6.4, 7.3, 7.4, 7.5
 */

import type { AxiosError } from 'axios';
import type { Student } from '../types';

/**
 * Form data interface for student editing
 */
export interface StudentFormData {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  contactPhone?: string;
  email?: string;
  guardianName?: string;
  guardianPhone?: string;
}

/**
 * Validation errors - maps field names to error messages
 */
export interface ValidationErrors {
  [field: string]: string;
}

/**
 * Classified error result
 */
export interface ClassifiedError {
  message: string;
  type: 'validation' | 'network' | 'server';
}

/**
 * Compute age from date of birth
 *
 * @param dateOfBirth - Date of birth as string or Date object
 * @returns Age in years
 */
export function computeAge(dateOfBirth: string | Date): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Compute the diff between original student data and updated form data.
 * Returns only the fields that have actually changed.
 *
 * Validates: Requirement 2.3
 *
 * @param original - The original student record
 * @param updated - The partial update from the form
 * @returns Object containing only the changed fields
 */
export function getChangedFields(original: Student, updated: Partial<Student>): Partial<Student> {
  const changes: Partial<Student> = {};
  for (const [key, value] of Object.entries(updated)) {
    if (original[key as keyof Student] !== value) {
      (changes as any)[key] = value;
    }
  }
  return changes;
}

/**
 * Classify API errors into network, server, or validation types.
 *
 * Validates: Requirements 7.3, 7.4, 7.5
 *
 * @param error - The error from an API call (typically AxiosError)
 * @returns Classified error with message and type
 */
export function classifyError(error: unknown): ClassifiedError {
  const axiosError = error as AxiosError<{ error?: string }>;

  if (!axiosError.response) {
    return { message: 'Network error. Please try again.', type: 'network' };
  }

  if (axiosError.response.status >= 500) {
    return { message: 'Something went wrong. Please try again later.', type: 'server' };
  }

  // 4xx - use server message if available
  const serverMessage = axiosError.response.data?.error || 'An error occurred.';
  return { message: serverMessage, type: 'validation' };
}

/**
 * Validate student form data with required fields, email format,
 * phone length, and guardian conditional logic.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 *
 * @param formData - The form data to validate
 * @param dateOfBirth - Optional date of birth for age computation (guardian logic)
 * @returns Object containing field-specific error messages (empty if valid)
 */
export function validateStudentForm(formData: StudentFormData, dateOfBirth?: string | Date): ValidationErrors {
  const errors: ValidationErrors = {};

  // Required fields validation (Requirement 3.1)
  if (!formData.fullName || formData.fullName.trim().length === 0) {
    errors.fullName = 'Full name is required';
  }

  if (!formData.dateOfBirth || formData.dateOfBirth.trim().length === 0) {
    errors.dateOfBirth = 'Date of birth is required';
  }

  if (!formData.gender || formData.gender.trim().length === 0) {
    errors.gender = 'Gender is required';
  }

  if (!formData.contactPhone || formData.contactPhone.trim().length === 0) {
    errors.contactPhone = 'Contact phone is required';
  }

  // Email format validation (Requirement 3.3)
  if (formData.email && formData.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
  }

  // Phone length validation (Requirement 3.4)
  if (formData.contactPhone && formData.contactPhone.trim().length > 0) {
    const digits = formData.contactPhone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      errors.contactPhone = 'Phone number must be 10-15 digits';
    }
  }

  // Guardian conditional validation (Requirement 3.2)
  const dobToCheck = dateOfBirth || formData.dateOfBirth;
  if (dobToCheck) {
    const age = computeAge(dobToCheck);
    if (age < 18) {
      if (!formData.guardianName || formData.guardianName.trim().length === 0) {
        errors.guardianName = 'Guardian name is required';
      }
      if (!formData.guardianPhone || formData.guardianPhone.trim().length === 0) {
        errors.guardianPhone = 'Guardian phone is required';
      } else {
        // Guardian phone length validation
        const guardianDigits = formData.guardianPhone.replace(/\D/g, '');
        if (guardianDigits.length < 10 || guardianDigits.length > 15) {
          errors.guardianPhone = 'Phone number must be 10-15 digits';
        }
      }
    }
  }

  return errors;
}

/**
 * Check if a user can edit a student based on role and assignment.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 6.4
 *
 * @param role - The user's role
 * @param userId - The user's ID
 * @param student - The student record with optional assignedCoachId
 * @returns true if the user has permission to edit the student
 */
export function canEditStudent(role: string, userId: string, student: { assignedCoachId?: string }): boolean {
  if (role === 'HEAD_COACH') {
    return true;
  }
  if (role === 'ASSISTANT_COACH' && student.assignedCoachId === userId) {
    return true;
  }
  return false;
}

/**
 * Check if a user can archive a student based on role.
 *
 * Validates: Requirements 4.1, 4.2
 *
 * @param role - The user's role
 * @returns true if the user has permission to archive students
 */
export function canArchiveStudent(role: string): boolean {
  return role === 'HEAD_COACH';
}

/**
 * Property-based tests for Student Profile utility functions
 * Framework: Vitest + fast-check
 * Feature: student-profile-crud
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  canEditStudent,
  canArchiveStudent,
  getChangedFields,
  validateStudentForm,
  type StudentFormData,
} from './studentProfileUtils';
import type { Student } from '../types';

// --- Generators ---

const roleArbitrary = fc.oneof(
  fc.constant('HEAD_COACH'),
  fc.constant('ASSISTANT_COACH'),
  fc.constant('STUDENT'),
  fc.string({ minLength: 1, maxLength: 20 })
);

const userIdArbitrary = fc.uuid();

const studentWithCoachArbitrary = fc.record({
  assignedCoachId: fc.option(fc.uuid(), { nil: undefined }),
});

// A minimal valid Student for getChangedFields tests
const genderArbitrary = fc.oneof(
  fc.constant('Male' as const),
  fc.constant('Female' as const),
  fc.constant('Other' as const)
);

const skillLevelArbitrary = fc.oneof(
  fc.constant('Beginner' as const),
  fc.constant('Intermediate' as const),
  fc.constant('Advanced' as const),
  fc.constant('Professional' as const)
);

const baseStudentArbitrary: fc.Arbitrary<Student> = fc.record({
  id: fc.uuid(),
  fullName: fc.string({ minLength: 1, maxLength: 50 }),
  dateOfBirth: fc.date({ min: new Date('1980-01-01'), max: new Date('2015-01-01') }),
  age: fc.integer({ min: 5, max: 60 }),
  gender: genderArbitrary,
  contactPhone: fc.stringMatching(/^[0-9]{10,15}$/),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
  guardianName: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  guardianPhone: fc.option(fc.stringMatching(/^[0-9]{10,15}$/), { nil: undefined }),
  baidNumber: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  batchId: fc.option(fc.uuid(), { nil: undefined }),
  assignedCoachId: fc.option(fc.uuid(), { nil: undefined }),
  profilePhoto: fc.option(fc.string(), { nil: undefined }),
  height: fc.option(fc.integer({ min: 100, max: 220 }), { nil: undefined }),
  weight: fc.option(fc.integer({ min: 20, max: 150 }), { nil: undefined }),
  bmi: fc.option(fc.float({ min: 10, max: 50, noNaN: true }), { nil: undefined }),
  bloodGroup: fc.option(fc.string({ minLength: 1, maxLength: 5 }), { nil: undefined }),
  medicalConditions: fc.option(fc.string(), { nil: undefined }),
  emergencyContact: fc.option(fc.string(), { nil: undefined }),
  strengths: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 3 }),
  weaknesses: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 3 }),
  coachFeedback: fc.option(fc.string(), { nil: undefined }),
  skillLevel: skillLevelArbitrary,
  status: fc.option(fc.oneof(fc.constant('active' as const), fc.constant('archived' as const)), { nil: undefined }),
  archivedAt: fc.option(fc.string(), { nil: undefined }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

// --- Property Tests ---

describe('Feature: student-profile-crud, Property 1: Edit permission visibility', () => {
  /**
   * Validates: Requirements 1.1, 1.2, 1.3
   *
   * For any user role and student, canEditStudent returns true iff
   * HEAD_COACH or (ASSISTANT_COACH with matching assignedCoachId)
   */
  it('canEditStudent returns true iff HEAD_COACH or assigned ASSISTANT_COACH', () => {
    fc.assert(
      fc.property(roleArbitrary, userIdArbitrary, studentWithCoachArbitrary, (role, userId, student) => {
        const result = canEditStudent(role, userId, student);

        const expected =
          role === 'HEAD_COACH' ||
          (role === 'ASSISTANT_COACH' && student.assignedCoachId === userId);

        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: student-profile-crud, Property 2: Archive permission is HEAD_COACH-exclusive', () => {
  /**
   * Validates: Requirements 4.1, 4.2
   *
   * canArchiveStudent returns true iff role is HEAD_COACH
   */
  it('canArchiveStudent returns true iff role is HEAD_COACH', () => {
    fc.assert(
      fc.property(roleArbitrary, (role) => {
        const result = canArchiveStudent(role);
        expect(result).toBe(role === 'HEAD_COACH');
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: student-profile-crud, Property 4: PATCH payload contains only changed fields', () => {
  /**
   * Validates: Requirements 2.3
   *
   * For any subset of modified fields, getChangedFields returns exactly those fields
   */
  it('getChangedFields returns exactly the fields that differ', () => {
    fc.assert(
      fc.property(baseStudentArbitrary, fc.integer({ min: 0, max: 5 }), (student, seed) => {
        // Create a modified version with some fields changed
        const modifiableFields: (keyof Student)[] = [
          'fullName',
          'contactPhone',
          'email',
          'guardianName',
          'guardianPhone',
        ];

        // Pick a random subset of fields to change
        const fieldsToChange = modifiableFields.filter((_, i) => ((seed >> i) & 1) === 1);

        const updated: Partial<Student> = {};
        for (const field of fieldsToChange) {
          // Set to a definitely different value
          if (field === 'fullName') {
            updated.fullName = student.fullName + '_changed';
          } else if (field === 'contactPhone') {
            updated.contactPhone = '9999999999';
          } else if (field === 'email') {
            updated.email = 'changed@test.com';
          } else if (field === 'guardianName') {
            updated.guardianName = (student.guardianName || '') + '_changed';
          } else if (field === 'guardianPhone') {
            updated.guardianPhone = '8888888888';
          }
        }

        // Also add an unchanged field to verify it's not included
        updated.gender = student.gender;

        const result = getChangedFields(student, updated);

        // Result should contain all fields we changed
        for (const field of fieldsToChange) {
          expect(result).toHaveProperty(field);
        }

        // Result should NOT contain the unchanged field
        expect(result).not.toHaveProperty('gender');
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: student-profile-crud, Property 5: Required field validation blocks submission', () => {
  /**
   * Validates: Requirements 3.1
   *
   * Empty required fields produce errors
   */
  it('empty required fields produce validation errors', () => {
    const requiredFields = ['fullName', 'dateOfBirth', 'gender', 'contactPhone'] as const;

    fc.assert(
      fc.property(
        fc.subarray(requiredFields as unknown as string[], { minLength: 1 }),
        (emptyFields) => {
          const formData: StudentFormData = {
            fullName: 'Test Name',
            dateOfBirth: '2000-01-01',
            gender: 'Male',
            contactPhone: '1234567890',
          };

          // Clear the selected required fields
          for (const field of emptyFields) {
            (formData as any)[field] = '';
          }

          const errors = validateStudentForm(formData);

          // Each emptied required field should produce an error
          for (const field of emptyFields) {
            expect(errors[field]).toBeDefined();
            expect(errors[field].length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: student-profile-crud, Property 6: Guardian fields required for under-18', () => {
  /**
   * Validates: Requirements 3.2
   *
   * When age < 18 and guardian fields empty, validation fails
   */
  it('under-18 students with empty guardian fields produce validation errors', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 17 }), // age under 18
        fc.boolean(), // whether guardianName is empty
        fc.boolean(), // whether guardianPhone is empty
        (age, emptyName, emptyPhone) => {
          // Only test when at least one guardian field is empty
          if (!emptyName && !emptyPhone) return;

          // Compute a DOB that gives the desired age
          const now = new Date();
          const dobYear = now.getFullYear() - age;
          const dob = `${dobYear}-01-01`;

          const formData: StudentFormData = {
            fullName: 'Test Student',
            dateOfBirth: dob,
            gender: 'Male',
            contactPhone: '1234567890',
            guardianName: emptyName ? '' : 'Parent Name',
            guardianPhone: emptyPhone ? '' : '9876543210',
          };

          const errors = validateStudentForm(formData, dob);

          if (emptyName) {
            expect(errors.guardianName).toBeDefined();
          }
          if (emptyPhone) {
            expect(errors.guardianPhone).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: student-profile-crud, Property 7: Invalid email format detection', () => {
  /**
   * Validates: Requirements 3.3
   *
   * Strings without valid email format produce errors
   */
  it('strings without @ or domain produce email validation errors', () => {
    // Generate strings that are definitely not valid emails
    const invalidEmailArbitrary = fc.oneof(
      fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes('@')), // no @
      fc.string({ minLength: 1, maxLength: 30 }).map((s) => s.replace(/@/g, '') + '@'), // @ at end
      fc.string({ minLength: 1, maxLength: 15 }).map((s) => '@' + s.replace(/[.@]/g, '')), // @ at start, no dot in domain
      fc.constant('user@'),
      fc.constant('@domain'),
      fc.constant('plainstring'),
      fc.constant('user@.com'),
      fc.constant('user@domain.'),
    );

    fc.assert(
      fc.property(invalidEmailArbitrary, (invalidEmail) => {
        // Skip empty strings as email validation is skipped when empty
        if (invalidEmail.trim().length === 0) return;

        const formData: StudentFormData = {
          fullName: 'Test Student',
          dateOfBirth: '2000-01-01',
          gender: 'Male',
          contactPhone: '1234567890',
          email: invalidEmail,
        };

        const errors = validateStudentForm(formData);

        // The email regex is: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        // If it doesn't match, there should be an error
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(invalidEmail)) {
          expect(errors.email).toBe('Invalid email format');
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: student-profile-crud, Property 8: Phone number length validation', () => {
  /**
   * Validates: Requirements 3.4
   *
   * Phone strings outside 10-15 digit range produce errors
   */
  it('phone numbers with fewer than 10 or more than 15 digits produce errors', () => {
    const invalidPhoneArbitrary = fc.oneof(
      // Too few digits (1-9 digits)
      fc.integer({ min: 1, max: 9 }).chain((len) =>
        fc.stringMatching(new RegExp(`^[0-9]{${len}}$`))
      ),
      // Too many digits (16-20 digits)
      fc.integer({ min: 16, max: 20 }).chain((len) =>
        fc.stringMatching(new RegExp(`^[0-9]{${len}}$`))
      )
    );

    fc.assert(
      fc.property(invalidPhoneArbitrary, (invalidPhone) => {
        const formData: StudentFormData = {
          fullName: 'Test Student',
          dateOfBirth: '2000-01-01',
          gender: 'Male',
          contactPhone: invalidPhone,
        };

        const errors = validateStudentForm(formData);

        expect(errors.contactPhone).toBe('Phone number must be 10-15 digits');
      }),
      { numRuns: 100 }
    );
  });
});

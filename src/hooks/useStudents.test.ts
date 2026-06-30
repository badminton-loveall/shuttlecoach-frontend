/**
 * Tests for useStudents hook
 * Validates CRUD operations, localStorage persistence, validation, and computed fields.
 * Requirements: 5.1, 5.7, 29.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStudents } from './useStudents';
import type { CreateStudentData } from './useStudents';

const STORAGE_KEY = 'shuttlecoach_students';

const validStudentData: CreateStudentData = {
  fullName: 'Test Student',
  dateOfBirth: '2010-06-15',
  gender: 'Male',
  contactPhone: '9876500000',
  email: 'test@example.com',
  height: 160,
  weight: 55,
  skillLevel: 'Beginner',
  strengths: ['Speed'],
  weaknesses: ['Power'],
};

describe('useStudents', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loading students', () => {
    it('should load initial students from JSON data on mount', () => {
      const { result } = renderHook(() => useStudents());
      // students.json has 10 students
      expect(result.current.students.length).toBe(10);
      expect(result.current.students[0].fullName).toBe('Arjun Verma');
    });

    it('should parse date strings into Date objects', () => {
      const { result } = renderHook(() => useStudents());
      const student = result.current.students[0];
      expect(student.dateOfBirth).toBeInstanceOf(Date);
      expect(student.createdAt).toBeInstanceOf(Date);
      expect(student.updatedAt).toBeInstanceOf(Date);
    });

    it('should merge localStorage data with initial data (localStorage takes precedence)', () => {
      // Store a modified version of student-001
      const modified = {
        id: 'student-001',
        fullName: 'Modified Arjun',
        dateOfBirth: '2012-05-15',
        age: 13,
        gender: 'Male',
        contactPhone: '9876543210',
        strengths: [],
        weaknesses: [],
        skillLevel: 'Intermediate',
        createdAt: '2026-01-05T09:00:00Z',
        updatedAt: '2026-02-01T09:00:00Z',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([modified]));

      const { result } = renderHook(() => useStudents());

      const arjun = result.current.students.find((s) => s.id === 'student-001');
      expect(arjun?.fullName).toBe('Modified Arjun');
      expect(arjun?.skillLevel).toBe('Intermediate');
      // Other initial students should still be present
      expect(result.current.students.length).toBe(10);
    });

    it('should include new students from localStorage not in initial data', () => {
      const newStudent = {
        id: 'student-new',
        fullName: 'New Student',
        dateOfBirth: '2011-01-01',
        age: 14,
        gender: 'Female',
        contactPhone: '1234567890',
        strengths: [],
        weaknesses: [],
        skillLevel: 'Beginner',
        createdAt: '2026-02-01T09:00:00Z',
        updatedAt: '2026-02-01T09:00:00Z',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newStudent]));

      const { result } = renderHook(() => useStudents());
      // 10 from JSON + 1 new from localStorage
      expect(result.current.students.length).toBe(11);
      expect(result.current.students.find((s) => s.id === 'student-new')).toBeDefined();
    });
  });

  describe('getStudent', () => {
    it('should return a student by id', () => {
      const { result } = renderHook(() => useStudents());
      const student = result.current.getStudent('student-003');
      expect(student?.fullName).toBe('Rohan Kapoor');
    });

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => useStudents());
      expect(result.current.getStudent('non-existent')).toBeUndefined();
    });
  });

  describe('createStudent', () => {
    it('should create a new student with valid data', () => {
      const { result } = renderHook(() => useStudents());

      let newStudent;
      act(() => {
        newStudent = result.current.createStudent(validStudentData);
      });

      expect(result.current.students.length).toBe(11);
      expect(newStudent).toBeDefined();
    });

    it('should generate a unique id for new students', () => {
      const { result } = renderHook(() => useStudents());

      let student1, student2;
      act(() => {
        student1 = result.current.createStudent(validStudentData);
      });
      act(() => {
        student2 = result.current.createStudent({
          ...validStudentData,
          fullName: 'Another Student',
        });
      });

      expect(student1!.id).not.toBe(student2!.id);
    });

    it('should auto-compute age from dateOfBirth', () => {
      const { result } = renderHook(() => useStudents());

      let newStudent;
      act(() => {
        newStudent = result.current.createStudent(validStudentData);
      });

      expect(newStudent!.age).toBeGreaterThan(0);
      expect(typeof newStudent!.age).toBe('number');
    });

    it('should auto-compute bmi from height and weight', () => {
      const { result } = renderHook(() => useStudents());

      let newStudent;
      act(() => {
        newStudent = result.current.createStudent(validStudentData);
      });

      // BMI = 55 / (1.60)^2 = 21.5
      expect(newStudent!.bmi).toBeCloseTo(21.5, 0);
    });

    it('should not compute bmi when height or weight is missing', () => {
      const { result } = renderHook(() => useStudents());

      let newStudent;
      act(() => {
        newStudent = result.current.createStudent({
          ...validStudentData,
          height: undefined,
          weight: undefined,
        });
      });

      expect(newStudent!.bmi).toBeUndefined();
    });

    it('should persist new student to localStorage', () => {
      const { result } = renderHook(() => useStudents());

      act(() => {
        result.current.createStudent(validStudentData);
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.length).toBe(11);
      expect(stored.find((s: { fullName: string }) => s.fullName === 'Test Student')).toBeDefined();
    });

    it('should set createdAt and updatedAt to current time', () => {
      const { result } = renderHook(() => useStudents());

      const before = new Date();
      let newStudent;
      act(() => {
        newStudent = result.current.createStudent(validStudentData);
      });
      const after = new Date();

      expect(newStudent!.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(newStudent!.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(newStudent!.updatedAt.getTime()).toEqual(newStudent!.createdAt.getTime());
    });

    it('should default skillLevel to Beginner if not provided', () => {
      const { result } = renderHook(() => useStudents());

      let newStudent;
      act(() => {
        newStudent = result.current.createStudent({
          ...validStudentData,
          skillLevel: undefined,
        });
      });

      expect(newStudent!.skillLevel).toBe('Beginner');
    });

    it('should throw error if fullName is missing', () => {
      const { result } = renderHook(() => useStudents());

      expect(() => {
        act(() => {
          result.current.createStudent({ ...validStudentData, fullName: '' });
        });
      }).toThrow('Validation failed');
    });

    it('should throw error if dateOfBirth is missing', () => {
      const { result } = renderHook(() => useStudents());

      expect(() => {
        act(() => {
          result.current.createStudent({
            ...validStudentData,
            dateOfBirth: '' as unknown as string,
          });
        });
      }).toThrow('Validation failed');
    });

    it('should throw error if gender is missing', () => {
      const { result } = renderHook(() => useStudents());

      expect(() => {
        act(() => {
          result.current.createStudent({
            ...validStudentData,
            gender: '' as unknown as 'Male',
          });
        });
      }).toThrow('Validation failed');
    });

    it('should throw error if contactPhone is missing', () => {
      const { result } = renderHook(() => useStudents());

      expect(() => {
        act(() => {
          result.current.createStudent({ ...validStudentData, contactPhone: '' });
        });
      }).toThrow('Validation failed');
    });
  });

  describe('updateStudent', () => {
    it('should update an existing student', () => {
      const { result } = renderHook(() => useStudents());

      let updated;
      act(() => {
        updated = result.current.updateStudent('student-001', {
          fullName: 'Arjun Updated',
        });
      });

      expect(updated!.fullName).toBe('Arjun Updated');
      expect(result.current.getStudent('student-001')?.fullName).toBe('Arjun Updated');
    });

    it('should preserve fields not included in update', () => {
      const { result } = renderHook(() => useStudents());

      const original = result.current.getStudent('student-002');

      act(() => {
        result.current.updateStudent('student-002', { fullName: 'Neha Updated' });
      });

      const updated = result.current.getStudent('student-002');
      expect(updated?.fullName).toBe('Neha Updated');
      expect(updated?.gender).toBe(original?.gender);
      expect(updated?.contactPhone).toBe(original?.contactPhone);
      expect(updated?.skillLevel).toBe(original?.skillLevel);
    });

    it('should recompute age when dateOfBirth is updated', () => {
      const { result } = renderHook(() => useStudents());

      act(() => {
        result.current.updateStudent('student-001', {
          dateOfBirth: '2015-01-01',
        });
      });

      const updated = result.current.getStudent('student-001');
      // Age should reflect the new DOB
      expect(updated?.age).toBeLessThan(13);
    });

    it('should recompute bmi when height is updated', () => {
      const { result } = renderHook(() => useStudents());

      act(() => {
        result.current.updateStudent('student-001', { height: 170 });
      });

      const updated = result.current.getStudent('student-001');
      // Original weight is 48, new height 170 → BMI = 48 / (1.70^2) ≈ 16.6
      expect(updated?.bmi).toBeCloseTo(16.6, 0);
    });

    it('should recompute bmi when weight is updated', () => {
      const { result } = renderHook(() => useStudents());

      act(() => {
        result.current.updateStudent('student-001', { weight: 60 });
      });

      const updated = result.current.getStudent('student-001');
      // Original height is 155, new weight 60 → BMI = 60 / (1.55^2) ≈ 25.0
      expect(updated?.bmi).toBeCloseTo(25.0, 0);
    });

    it('should update the updatedAt timestamp', () => {
      const { result } = renderHook(() => useStudents());

      const before = new Date();
      act(() => {
        result.current.updateStudent('student-001', { fullName: 'Updated Name' });
      });

      const updated = result.current.getStudent('student-001');
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should persist changes to localStorage', () => {
      const { result } = renderHook(() => useStudents());

      act(() => {
        result.current.updateStudent('student-001', { fullName: 'Persisted Name' });
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      const found = stored.find((s: { id: string }) => s.id === 'student-001');
      expect(found.fullName).toBe('Persisted Name');
    });

    it('should throw error for non-existent student id', () => {
      const { result } = renderHook(() => useStudents());

      expect(() => {
        act(() => {
          result.current.updateStudent('non-existent', { fullName: 'Test' });
        });
      }).toThrow('not found');
    });

    it('should throw error if updating fullName to empty', () => {
      const { result } = renderHook(() => useStudents());

      expect(() => {
        act(() => {
          result.current.updateStudent('student-001', { fullName: '' });
        });
      }).toThrow('Validation failed');
    });

    it('should throw error if updating contactPhone to empty', () => {
      const { result } = renderHook(() => useStudents());

      expect(() => {
        act(() => {
          result.current.updateStudent('student-001', { contactPhone: '' });
        });
      }).toThrow('Validation failed');
    });
  });

  describe('persistence across refreshes', () => {
    it('should restore created students after re-mounting', () => {
      const { result, unmount } = renderHook(() => useStudents());

      act(() => {
        result.current.createStudent(validStudentData);
      });

      unmount();

      // Re-render (simulates page refresh with same localStorage)
      const { result: result2 } = renderHook(() => useStudents());
      expect(result2.current.students.length).toBe(11);
      expect(
        result2.current.students.find((s) => s.fullName === 'Test Student')
      ).toBeDefined();
    });

    it('should restore updated students after re-mounting', () => {
      const { result, unmount } = renderHook(() => useStudents());

      act(() => {
        result.current.updateStudent('student-001', { fullName: 'Persisted Update' });
      });

      unmount();

      const { result: result2 } = renderHook(() => useStudents());
      expect(result2.current.getStudent('student-001')?.fullName).toBe('Persisted Update');
    });
  });
});

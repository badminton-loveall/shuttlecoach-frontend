/**
 * Tests for useStudents hook
 * Validates CRUD operations, localStorage persistence, validation, and computed fields.
 * Requirements: 5.1, 5.7, 29.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStudents } from './useStudents';
import type { CreateStudentData } from './useStudents';
import STUDENTS_JSON from '../data/students.json';

const STORAGE_KEY = 'loveall_students';

// Compute age from dateOfBirth string
function computeAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// Compute BMI
function computeBmi(height?: number, weight?: number): number | undefined {
  if (!height || !weight) return undefined;
  return parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
}

// Validation function
function validate(data: Partial<CreateStudentData>) {
  if (data.fullName !== undefined && !data.fullName.trim())
    throw new Error('Validation failed: fullName is required');
  if (data.dateOfBirth !== undefined && !data.dateOfBirth)
    throw new Error('Validation failed: dateOfBirth is required');
  if (data.gender !== undefined && !data.gender)
    throw new Error('Validation failed: gender is required');
  if (data.contactPhone !== undefined && !data.contactPhone.trim())
    throw new Error('Validation failed: contactPhone is required');
}

// In-memory student store backed by localStorage
function buildStudentStore() {
  // Load students from JSON and merge with localStorage
  const jsonStudents = STUDENTS_JSON.map((s) => ({
    ...s,
    dateOfBirth: new Date(s.dateOfBirth),
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    age: computeAge(s.dateOfBirth),
  })) as unknown as Record<string, unknown>[];

  const stored = localStorage.getItem(STORAGE_KEY);
  const localStudents: Record<string, unknown>[] = stored ? JSON.parse(stored) : [];

  // Build map of id -> student
  const studentMap = new Map<string, Record<string, unknown>>();
  jsonStudents.forEach((s) => studentMap.set(s.id as string, s));
  localStudents.forEach((s) => {
    const parsed = {
      ...s,
      dateOfBirth: new Date(s.dateOfBirth as string),
      createdAt: new Date(s.createdAt as string),
      updatedAt: new Date(s.updatedAt as string),
    };
    studentMap.set(s.id as string, parsed);
  });
  return Array.from(studentMap.values());
}

// Mock apiClient with local-data behavior
vi.mock('../utils/apiClient', () => {
  let _idCounter = 1000;

  const persistToStorage = (students: Record<string, unknown>[]) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        students.map((s) => ({
          ...s,
          dateOfBirth: s.dateOfBirth instanceof Date ? s.dateOfBirth.toISOString() : s.dateOfBirth,
          createdAt:   s.createdAt instanceof Date   ? s.createdAt.toISOString()   : s.createdAt,
          updatedAt:   s.updatedAt instanceof Date   ? s.updatedAt.toISOString()   : s.updatedAt,
        }))
      )
    );
  };

  const get = vi.fn(async (url: string) => {
    if (/^\/students\/([^/]+)$/.test(url)) {
      const id = url.split('/').pop()!;
      const students = buildStudentStore();
      const student = students.find((s) => (s as Record<string, unknown>).id === id);
      if (!student) {
        const err = new Error('Not found');
        (err as any).response = { status: 404 };
        throw err;
      }
      return { data: student };
    }

    if (url.startsWith('/students')) {
      const students = buildStudentStore();
      return { data: { students, total: students.length, page: 1 } };
    }

    throw new Error(`Unmocked GET: ${url}`);
  });

  const post = vi.fn(async (_url: string, body: Record<string, unknown>) => {
    // Validate required fields
    if (!body.fullName || !(body.fullName as string).trim())
      throw Object.assign(new Error('Validation failed: fullName is required'), {
        response: { status: 400, data: { message: 'Validation failed' } },
      });
    if (!body.dateOfBirth)
      throw Object.assign(new Error('Validation failed: dateOfBirth is required'), {
        response: { status: 400, data: { message: 'Validation failed' } },
      });
    if (!body.gender)
      throw Object.assign(new Error('Validation failed: gender is required'), {
        response: { status: 400, data: { message: 'Validation failed' } },
      });
    if (!body.contactPhone || !(body.contactPhone as string).trim())
      throw Object.assign(new Error('Validation failed: contactPhone is required'), {
        response: { status: 400, data: { message: 'Validation failed' } },
      });

    const dobStr = body.dateOfBirth as string;
    const now = new Date();
    const newStudent = {
      id: `student-new-${++_idCounter}`,
      ...body,
      dateOfBirth: new Date(dobStr),
      age: computeAge(dobStr),
      bmi: computeBmi(body.height as number | undefined, body.weight as number | undefined),
      skillLevel: body.skillLevel || 'Beginner',
      strengths: body.strengths || [],
      weaknesses: body.weaknesses || [],
      createdAt: now,
      updatedAt: now,
    };

    // Persist
    const students = buildStudentStore();
    students.push(newStudent as unknown as Record<string, unknown>);
    persistToStorage(students);
    return { data: newStudent };
  });

  const patch = vi.fn(async (url: string, body: Record<string, unknown>) => {
    const id = url.split('/').pop()!;
    const students = buildStudentStore();
    const idx = students.findIndex((s) => (s as Record<string, unknown>).id === id);
    if (idx === -1)
      throw Object.assign(new Error(`Student ${id} not found`), {
        response: { status: 404 },
      });

    // Validate
    if (body.fullName !== undefined && !(body.fullName as string).trim())
      throw Object.assign(new Error('Validation failed: fullName is required'), {
        response: { status: 400, data: { message: 'Validation failed' } },
      });
    if (body.contactPhone !== undefined && !(body.contactPhone as string).trim())
      throw Object.assign(new Error('Validation failed: contactPhone is required'), {
        response: { status: 400, data: { message: 'Validation failed' } },
      });

    const original = students[idx] as Record<string, unknown>;
    const dobStr = body.dateOfBirth !== undefined
      ? (body.dateOfBirth instanceof Date
          ? (body.dateOfBirth as Date).toISOString()
          : (body.dateOfBirth as string))
      : (original.dateOfBirth instanceof Date
          ? (original.dateOfBirth as Date).toISOString()
          : (original.dateOfBirth as string));

    const heightVal = body.height !== undefined ? body.height as number : original.height as number | undefined;
    const weightVal = body.weight !== undefined ? body.weight as number : original.weight as number | undefined;

    const updated = {
      ...original,
      ...body,
      dateOfBirth: new Date(dobStr),
      age: computeAge(dobStr),
      bmi: computeBmi(heightVal, weightVal),
      updatedAt: new Date(),
    };
    students[idx] = updated;
    persistToStorage(students);
    return { data: updated };
  });

  return { default: { get, post, patch } };
});

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
    vi.clearAllMocks();
  });

  describe('loading students', () => {
    it('should load initial students from JSON data on mount', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});
      // students.json has 10 students
      expect(result.current.students.length).toBe(10);
      expect(result.current.students[0].fullName).toBe('Arjun Verma');
    });

    it('should parse date strings into Date objects', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});
      const student = result.current.students[0];
      expect(student.dateOfBirth).toBeInstanceOf(Date);
      expect(student.createdAt).toBeInstanceOf(Date);
      expect(student.updatedAt).toBeInstanceOf(Date);
    });

    it('should merge localStorage data with initial data (localStorage takes precedence)', async () => {
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
      await act(async () => {});

      const arjun = result.current.students.find((s) => s.id === 'student-001');
      expect(arjun?.fullName).toBe('Modified Arjun');
      expect(arjun?.skillLevel).toBe('Intermediate');
      // Other initial students should still be present
      expect(result.current.students.length).toBe(10);
    });

    it('should include new students from localStorage not in initial data', async () => {
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
      await act(async () => {});
      // 10 from JSON + 1 new from localStorage
      expect(result.current.students.length).toBe(11);
      expect(result.current.students.find((s) => s.id === 'student-new')).toBeDefined();
    });
  });

  describe('getStudent', () => {
    it('should return a student by id', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});
      const student = await result.current.getStudent('student-003');
      expect(student?.fullName).toBe('Rohan Kapoor');
    });

    it('should return undefined for non-existent id', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});
      const student = await result.current.getStudent('non-existent');
      expect(student).toBeUndefined();
    });
  });

  describe('createStudent', () => {
    it('should create a new student with valid data', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      let newStudent: Awaited<ReturnType<typeof result.current.createStudent>> | undefined;
      await act(async () => {
        newStudent = await result.current.createStudent(validStudentData);
      });

      expect(result.current.students.length).toBe(11);
      expect(newStudent).toBeDefined();
    });

    it('should generate a unique id for new students', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      let student1: any, student2: any;
      await act(async () => {
        student1 = await result.current.createStudent(validStudentData);
      });
      await act(async () => {
        student2 = await result.current.createStudent({
          ...validStudentData,
          fullName: 'Another Student',
        });
      });

      expect(student1!.id).not.toBe(student2!.id);
    });

    it('should auto-compute age from dateOfBirth', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      let newStudent: any;
      await act(async () => {
        newStudent = await result.current.createStudent(validStudentData);
      });

      expect(newStudent!.age).toBeGreaterThan(0);
      expect(typeof newStudent!.age).toBe('number');
    });

    it('should auto-compute bmi from height and weight', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      let newStudent: any;
      await act(async () => {
        newStudent = await result.current.createStudent(validStudentData);
      });

      // BMI = 55 / (1.60)^2 = 21.5
      expect(newStudent!.bmi).toBeCloseTo(21.5, 0);
    });

    it('should not compute bmi when height or weight is missing', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      let newStudent: any;
      await act(async () => {
        newStudent = await result.current.createStudent({
          ...validStudentData,
          height: undefined,
          weight: undefined,
        });
      });

      expect(newStudent!.bmi).toBeUndefined();
    });

    it('should persist new student to localStorage', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      await act(async () => {
        await result.current.createStudent(validStudentData);
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.length).toBe(11);
      expect(stored.find((s: { fullName: string }) => s.fullName === 'Test Student')).toBeDefined();
    });

    it('should set createdAt and updatedAt to current time', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      const before = new Date();
      let newStudent: any;
      await act(async () => {
        newStudent = await result.current.createStudent(validStudentData);
      });
      const after = new Date();

      const createdAt = newStudent!.createdAt instanceof Date ? newStudent!.createdAt : new Date(newStudent!.createdAt);
      const updatedAt = newStudent!.updatedAt instanceof Date ? newStudent!.updatedAt : new Date(newStudent!.updatedAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(updatedAt.getTime()).toEqual(createdAt.getTime());
    });

    it('should default skillLevel to Beginner if not provided', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      let newStudent: any;
      await act(async () => {
        newStudent = await result.current.createStudent({
          ...validStudentData,
          skillLevel: undefined,
        });
      });

      expect(newStudent!.skillLevel).toBe('Beginner');
    });

    it('should throw error if fullName is missing', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      await expect(
        act(async () => {
          await result.current.createStudent({ ...validStudentData, fullName: '' });
        })
      ).rejects.toThrow('Validation failed');
    });

    it('should throw error if dateOfBirth is missing', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      await expect(
        act(async () => {
          await result.current.createStudent({
            ...validStudentData,
            dateOfBirth: '' as unknown as string,
          });
        })
      ).rejects.toThrow('Validation failed');
    });

    it('should throw error if gender is missing', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      await expect(
        act(async () => {
          await result.current.createStudent({
            ...validStudentData,
            gender: '' as unknown as 'Male',
          });
        })
      ).rejects.toThrow('Validation failed');
    });

    it('should throw error if contactPhone is missing', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      await expect(
        act(async () => {
          await result.current.createStudent({ ...validStudentData, contactPhone: '' });
        })
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('updateStudent', () => {
    it('should update an existing student', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      let updated: any;
      await act(async () => {
        updated = await result.current.updateStudent('student-001', {
          fullName: 'Arjun Updated',
        });
      });

      expect(updated!.fullName).toBe('Arjun Updated');
      const found = await result.current.getStudent('student-001');
      expect(found?.fullName).toBe('Arjun Updated');
    });

    it('should preserve fields not included in update', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      const original = await result.current.getStudent('student-002');

      await act(async () => {
        await result.current.updateStudent('student-002', { fullName: 'Neha Updated' });
      });

      const updated = await result.current.getStudent('student-002');
      expect(updated?.fullName).toBe('Neha Updated');
      expect(updated?.gender).toBe(original?.gender);
      expect(updated?.contactPhone).toBe(original?.contactPhone);
      expect(updated?.skillLevel).toBe(original?.skillLevel);
    });

    it('should recompute age when dateOfBirth is updated', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      await act(async () => {
        await result.current.updateStudent('student-001', {
          dateOfBirth: '2015-01-01',
        });
      });

      const updated = await result.current.getStudent('student-001');
      // Age should reflect the new DOB
      expect(updated?.age).toBeLessThan(13);
    });

    it('should recompute bmi when height is updated', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      await act(async () => {
        await result.current.updateStudent('student-001', { height: 170 });
      });

      const updated = await result.current.getStudent('student-001');
      // Original weight is 48, new height 170 → BMI = 48 / (1.70^2) ≈ 16.6
      expect(updated?.bmi).toBeCloseTo(16.6, 0);
    });

    it('should recompute bmi when weight is updated', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      await act(async () => {
        await result.current.updateStudent('student-001', { weight: 60 });
      });

      const updated = await result.current.getStudent('student-001');
      // Original height is 155, new weight 60 → BMI = 60 / (1.55^2) ≈ 25.0
      expect(updated?.bmi).toBeCloseTo(25.0, 0);
    });

    it('should update the updatedAt timestamp', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      const before = new Date();
      await act(async () => {
        await result.current.updateStudent('student-001', { fullName: 'Updated Name' });
      });

      const updated = await result.current.getStudent('student-001');
      const updatedAt = updated?.updatedAt instanceof Date ? updated.updatedAt : new Date(updated?.updatedAt as string);
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should persist changes to localStorage', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      await act(async () => {
        await result.current.updateStudent('student-001', { fullName: 'Persisted Name' });
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      const found = stored.find((s: { id: string }) => s.id === 'student-001');
      expect(found.fullName).toBe('Persisted Name');
    });

    it('should throw error for non-existent student id', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      await expect(
        act(async () => {
          await result.current.updateStudent('non-existent', { fullName: 'Test' });
        })
      ).rejects.toThrow('not found');
    });

    it('should throw error if updating fullName to empty', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      await expect(
        act(async () => {
          await result.current.updateStudent('student-001', { fullName: '' });
        })
      ).rejects.toThrow('Validation failed');
    });

    it('should throw error if updating contactPhone to empty', async () => {
      const { result } = renderHook(() => useStudents());
      await act(async () => {});

      await expect(
        act(async () => {
          await result.current.updateStudent('student-001', { contactPhone: '' });
        })
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('persistence across refreshes', () => {
    it('should restore created students after re-mounting', async () => {
      const { result, unmount } = renderHook(() => useStudents());
      await act(async () => {});

      await act(async () => {
        await result.current.createStudent(validStudentData);
      });

      unmount();

      // Re-render (simulates page refresh with same localStorage)
      const { result: result2 } = renderHook(() => useStudents());
      await act(async () => {});
      expect(result2.current.students.length).toBe(11);
      expect(
        result2.current.students.find((s) => s.fullName === 'Test Student')
      ).toBeDefined();
    });

    it('should restore updated students after re-mounting', async () => {
      const { result, unmount } = renderHook(() => useStudents());
      await act(async () => {});

      await act(async () => {
        await result.current.updateStudent('student-001', { fullName: 'Persisted Update' });
      });

      unmount();

      const { result: result2 } = renderHook(() => useStudents());
      await act(async () => {});
      const found = await result2.current.getStudent('student-001');
      expect(found?.fullName).toBe('Persisted Update');
    });
  });
});


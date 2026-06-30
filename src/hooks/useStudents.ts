/**
 * useStudents Hook
 * Manages student CRUD operations with JSON persistence via localStorage.
 * Requirements: 5.1, 5.7, 29.5
 *
 * - Loads initial data from students.json on first mount
 * - Merges with localStorage changes (localStorage takes precedence)
 * - Provides create, update, and get operations
 * - Auto-computes age and bmi on create/update
 * - Validates required fields before saving
 */

import { useState, useEffect, useCallback } from 'react';
import type { Student, Gender, SkillLevel } from '../types';
import { calculateAge, calculateBMI } from '../utils/studentUtils';
import initialStudentsData from '../data/students.json';

const STORAGE_KEY = 'shuttlecoach_students';

export interface CreateStudentData {
  fullName: string;
  dateOfBirth: string | Date;
  gender: Gender;
  contactPhone: string;
  email?: string;
  guardianName?: string;
  guardianPhone?: string;
  baidNumber?: string;
  batchId?: string;
  assignedCoachId?: string;
  profilePhoto?: string;
  height?: number;
  weight?: number;
  bloodGroup?: string;
  medicalConditions?: string;
  emergencyContact?: string;
  strengths?: string[];
  weaknesses?: string[];
  coachFeedback?: string;
  skillLevel?: SkillLevel;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {}

/**
 * Parse a student record from raw JSON, ensuring Date fields are proper Date objects.
 */
function parseStudentDates(raw: Record<string, unknown>): Student {
  return {
    ...raw,
    dateOfBirth: new Date(raw.dateOfBirth as string),
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
  } as Student;
}

/**
 * Load initial students from JSON file, parsing date strings into Date objects.
 */
function loadInitialStudents(): Student[] {
  return (initialStudentsData as Record<string, unknown>[]).map(parseStudentDates);
}

/**
 * Load students from localStorage. Returns null if nothing stored.
 */
function loadFromStorage(): Student[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Record<string, unknown>[];
    return parsed.map(parseStudentDates);
  } catch {
    return null;
  }
}

/**
 * Save students array to localStorage.
 */
function saveToStorage(students: Student[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

/**
 * Merge localStorage students with initial data.
 * localStorage records take precedence (by id). New records from localStorage
 * that don't exist in initial data are also included.
 */
function mergeStudents(initial: Student[], stored: Student[]): Student[] {
  const storedMap = new Map(stored.map((s) => [s.id, s]));
  const merged: Student[] = [];

  // Start with initial students, overriding with stored versions
  for (const student of initial) {
    if (storedMap.has(student.id)) {
      merged.push(storedMap.get(student.id)!);
      storedMap.delete(student.id);
    } else {
      merged.push(student);
    }
  }

  // Add any new students that only exist in storage
  for (const student of storedMap.values()) {
    merged.push(student);
  }

  return merged;
}

/**
 * Validate required fields for a student record.
 * Throws an error with a descriptive message if validation fails.
 */
function validateRequiredFields(data: CreateStudentData | UpdateStudentData, isCreate: boolean): void {
  const errors: string[] = [];

  if (isCreate) {
    if (!data.fullName || data.fullName.trim() === '') {
      errors.push('fullName is required');
    }
    if (!data.dateOfBirth) {
      errors.push('dateOfBirth is required');
    }
    if (!data.gender) {
      errors.push('gender is required');
    }
    if (!data.contactPhone || data.contactPhone.trim() === '') {
      errors.push('contactPhone is required');
    }
  } else {
    // For update, validate only the fields that are provided
    if ('fullName' in data && (!data.fullName || data.fullName.trim() === '')) {
      errors.push('fullName cannot be empty');
    }
    if ('dateOfBirth' in data && !data.dateOfBirth) {
      errors.push('dateOfBirth cannot be empty');
    }
    if ('gender' in data && !data.gender) {
      errors.push('gender cannot be empty');
    }
    if ('contactPhone' in data && (!data.contactPhone || data.contactPhone.trim() === '')) {
      errors.push('contactPhone cannot be empty');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
}

/**
 * Generate a unique student ID.
 */
function generateId(): string {
  return `student-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Hook providing student CRUD operations with localStorage persistence.
 */
export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);

  // Load students on mount
  useEffect(() => {
    const initial = loadInitialStudents();
    const stored = loadFromStorage();

    if (stored) {
      setStudents(mergeStudents(initial, stored));
    } else {
      setStudents(initial);
    }
  }, []);

  /**
   * Get a single student by ID.
   */
  const getStudent = useCallback(
    (id: string): Student | undefined => {
      return students.find((s) => s.id === id);
    },
    [students]
  );

  /**
   * Create a new student record.
   * Validates required fields, computes age/bmi, persists to localStorage.
   */
  const createStudent = useCallback(
    (data: CreateStudentData): Student => {
      validateRequiredFields(data, true);

      const now = new Date();
      const dob = new Date(data.dateOfBirth);
      const age = calculateAge(dob);
      const bmi = data.height && data.weight ? calculateBMI(data.height, data.weight) : undefined;

      const newStudent: Student = {
        id: generateId(),
        fullName: data.fullName.trim(),
        dateOfBirth: dob,
        age,
        gender: data.gender,
        contactPhone: data.contactPhone.trim(),
        email: data.email,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        baidNumber: data.baidNumber,
        batchId: data.batchId,
        assignedCoachId: data.assignedCoachId,
        profilePhoto: data.profilePhoto,
        height: data.height,
        weight: data.weight,
        bmi: bmi ?? undefined,
        bloodGroup: data.bloodGroup,
        medicalConditions: data.medicalConditions,
        emergencyContact: data.emergencyContact,
        strengths: data.strengths ?? [],
        weaknesses: data.weaknesses ?? [],
        coachFeedback: data.coachFeedback,
        skillLevel: data.skillLevel ?? 'Beginner',
        createdAt: now,
        updatedAt: now,
      };

      const updatedStudents = [...students, newStudent];
      setStudents(updatedStudents);
      saveToStorage(updatedStudents);

      return newStudent;
    },
    [students]
  );

  /**
   * Update an existing student record.
   * Validates provided fields, recomputes age/bmi if relevant fields change, persists to localStorage.
   */
  const updateStudent = useCallback(
    (id: string, data: UpdateStudentData): Student => {
      validateRequiredFields(data, false);

      const index = students.findIndex((s) => s.id === id);
      if (index === -1) {
        throw new Error(`Student with id "${id}" not found`);
      }

      const existing = students[index];
      const now = new Date();

      // Merge partial data with existing
      const merged = { ...existing, ...data, updatedAt: now };

      // Recompute age if dateOfBirth changed
      if (data.dateOfBirth) {
        merged.dateOfBirth = new Date(data.dateOfBirth);
        merged.age = calculateAge(merged.dateOfBirth as Date);
      }

      // Recompute BMI if height or weight changed
      const height = data.height ?? existing.height;
      const weight = data.weight ?? existing.weight;
      if (height && weight && (data.height !== undefined || data.weight !== undefined)) {
        merged.bmi = calculateBMI(height, weight);
      }

      const updatedStudent = merged as Student;
      const updatedStudents = [...students];
      updatedStudents[index] = updatedStudent;

      setStudents(updatedStudents);
      saveToStorage(updatedStudents);

      return updatedStudent;
    },
    [students]
  );

  return {
    students,
    getStudent,
    createStudent,
    updateStudent,
  };
}

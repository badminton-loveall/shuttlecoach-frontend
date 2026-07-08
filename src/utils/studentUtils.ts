/**
 * Student Data Utilities and Calculations
 * Provides utility functions for student data manipulation, filtering, and calculations
 * Requirements: 5.4, 5.5, 24.3
 */

import type { Student, SkillLevel, StudentFilters } from '../types';

/**
 * Extended filters that include coach filtering (local to this utility)
 */
interface ExtendedStudentFilters extends StudentFilters {
  coach?: string;
}

/* ============================================================================
   CALCULATION UTILITIES
   ============================================================================ */

/**
 * Calculate age from date of birth
 * Takes into account whether the birthday has occurred this year
 * Returns the age as a whole number (no decimals)
 *
 * Example: Born 2012-05-15, today is 2026-01-10 → age 13
 * Example: Born 2012-05-15, today is 2026-05-15 → age 14
 *
 * @param dateOfBirth - The date of birth
 * @returns The current age as a whole number
 */
export const calculateAge = (dateOfBirth: Date): number => {
  if (!dateOfBirth) {
    return 0;
  }

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  // Start with the year difference
  let age = today.getFullYear() - birthDate.getFullYear();

  // Check if birthday hasn't occurred yet this year
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Calculate BMI (Body Mass Index) from height and weight
 * Formula: weight (kg) / (height (m))^2
 * Height conversion: 155 cm = 1.55 m
 * Returns the value rounded to 1 decimal place
 *
 * Example: height 155cm, weight 48kg → (48 / (1.55^2)) = 20.0
 *
 * @param heightCm - Height in centimeters
 * @param weightKg - Weight in kilograms
 * @returns BMI rounded to 1 decimal place
 */
export const calculateBMI = (heightCm: number, weightKg: number): number => {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return 0;
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  return parseFloat(bmi.toFixed(1));
};

/* ============================================================================
   FILTERING UTILITIES
   ============================================================================ */

/**
 * Filter students by batch ID
 * Returns only students assigned to the specified batch
 *
 * @param students - Array of students to filter
 * @param batchId - The batch ID to filter by
 * @returns Filtered array of students
 */
export const filterStudentsByBatch = (students: Student[], batchId: string): Student[] => {
  if (!students || !batchId) {
    return [];
  }

  return students.filter((student) => student.batchId === batchId);
};

/**
 * Filter students by assigned coach ID
 * Returns only students assigned to the specified coach
 *
 * @param students - Array of students to filter
 * @param coachId - The coach ID to filter by
 * @returns Filtered array of students
 */
export const filterStudentsByCoach = (students: Student[], coachId: string): Student[] => {
  if (!students || !coachId) {
    return [];
  }

  return students.filter((student) => student.assignedCoachId === coachId);
};

/**
 * Filter students by skill level
 * Returns only students with the specified skill level
 *
 * @param students - Array of students to filter
 * @param skillLevel - The skill level to filter by
 * @returns Filtered array of students
 */
export const filterStudentsBySkillLevel = (
  students: Student[],
  skillLevel: SkillLevel
): Student[] => {
  if (!students || !skillLevel) {
    return [];
  }

  return students.filter((student) => student.skillLevel === skillLevel);
};

/**
 * Filter students by multiple criteria
 * Applies multiple filters (search, batch, coach, skill level) simultaneously
 * All specified filters must match (AND logic)
 *
 * @param students - Array of students to filter
 * @param filters - Filter criteria object
 * @returns Filtered array of students
 */
export const filterStudentsByMultipleCriteria = (
  students: Student[],
  filters: ExtendedStudentFilters
): Student[] => {
  if (!students) {
    return [];
  }

  let filtered = [...students];

  // Apply batch filter
  if (filters.batch) {
    filtered = filterStudentsByBatch(filtered, filters.batch);
  }

  // Apply coach filter
  if (filters.coach) {
    filtered = filterStudentsByCoach(filtered, filters.coach);
  }

  // Apply skill level filter
  if (filters.skillLevel) {
    filtered = filterStudentsBySkillLevel(filtered, filters.skillLevel);
  }

  // Apply search filter (case-insensitive, partial matching)
  if (filters.search) {
    filtered = searchStudents(filtered, filters.search);
  }

  return filtered;
};

/* ============================================================================
   SEARCH UTILITIES
   ============================================================================ */

/**
 * Search students by name, BAID, and batch fields
 * Case-insensitive search with partial matching
 * Example: searchStudents(students, "arj") matches "Arjun Verma"
 *
 * @param students - Array of students to search
 * @param query - Search query string
 * @returns Array of matching students
 */
export const searchStudents = (students: Student[], query: string): Student[] => {
  if (!students || !query) {
    return students || [];
  }

  // Normalize query to lowercase for case-insensitive matching
  const normalizedQuery = query.toLowerCase().trim();

  if (normalizedQuery === '') {
    return students;
  }

  return students.filter((student) => {
    // Search in full name
    const nameMatch = student.fullName?.toLowerCase().includes(normalizedQuery) || false;

    // Search in BAID number
    const baidMatch = student.baidNumber?.toLowerCase().includes(normalizedQuery) || false;

    // Search in batch ID
    const batchMatch = student.batchId?.toLowerCase().includes(normalizedQuery) || false;

    // Return true if any field matches
    return nameMatch || baidMatch || batchMatch;
  });
};

/* ============================================================================
   EXPORT ALL UTILITIES
   ============================================================================ */

export default {
  // Calculation utilities
  calculateAge,
  calculateBMI,

  // Filtering utilities
  filterStudentsByBatch,
  filterStudentsByCoach,
  filterStudentsBySkillLevel,
  filterStudentsByMultipleCriteria,

  // Search utilities
  searchStudents,
};

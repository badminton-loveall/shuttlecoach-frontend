/**
 * Tests for useCoachStudents hook
 * Validates student fetching, loading/error states, and mutation functions.
 * Requirements: 8.1, 9.1, 17.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCoachStudents } from './useCoachStudents';
import apiClient from '../utils/apiClient';
import type { Student } from '../types';

// Mock the apiClient
vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockStudents: Student[] = [
  {
    id: 'student-001',
    fullName: 'Arjun Verma',
    dateOfBirth: new Date('2010-06-15'),
    age: 15,
    gender: 'Male',
    contactPhone: '9876543210',
    email: 'arjun@example.com',
    skillLevel: 'Beginner',
    strengths: ['Speed'],
    weaknesses: ['Power'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'student-002',
    fullName: 'Neha Sharma',
    dateOfBirth: new Date('2011-03-20'),
    age: 14,
    gender: 'Female',
    contactPhone: '9876543211',
    email: 'neha@example.com',
    skillLevel: 'Intermediate',
    strengths: ['Accuracy'],
    weaknesses: ['Endurance'],
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
  },
  {
    id: 'student-003',
    fullName: 'Rohan Kapoor',
    dateOfBirth: new Date('2009-12-10'),
    age: 16,
    gender: 'Male',
    contactPhone: '9876543212',
    email: 'rohan@example.com',
    skillLevel: 'Advanced',
    strengths: ['Smash', 'Speed'],
    weaknesses: ['Drop shots'],
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-03'),
  },
];

describe('useCoachStudents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('data fetching', () => {
    it('should fetch students for a coach on mount', async () => {
      const coachId = 'coach-001';
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith(`/coaches/${coachId}/students`);
      expect(result.current.students).toHaveLength(3);
      expect(result.current.students[0].fullName).toBe('Arjun Verma');
    });

    it('should set isLoading to true initially, then false after fetch', async () => {
      const coachId = 'coach-001';
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });

      const { result } = renderHook(() => useCoachStudents(coachId));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should parse date strings into Date objects', async () => {
      const coachId = 'coach-001';
      const rawStudents = mockStudents.map((s) => ({
        ...s,
        dateOfBirth: s.dateOfBirth.toISOString(),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }));

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: rawStudents,
      });

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.students[0].dateOfBirth).toBeInstanceOf(Date);
      expect(result.current.students[0].createdAt).toBeInstanceOf(Date);
      expect(result.current.students[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should handle empty student list', async () => {
      const coachId = 'coach-empty';
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
      });

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.students).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const coachId = 'coach-001';
      const apiError = new Error('Network error');
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load students. Please try again.');
      expect(result.current.students).toHaveLength(0);
    });

    it('should set error to null on successful fetch', async () => {
      const coachId = 'coach-001';
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });

    it('should log error to console for debugging', async () => {
      const coachId = 'coach-001';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      const apiError = new Error('API error');
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          `Failed to fetch students for coach ${coachId}:`,
          apiError
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('refetch functionality', () => {
    it('should refetch students when refetch is called', async () => {
      const coachId = 'coach-001';
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });

    it('should refetch when coachId changes', async () => {
      const coachId1 = 'coach-001';
      const coachId2 = 'coach-002';

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });

      const { result, rerender } = renderHook(
        ({ coachId }: { coachId: string }) => useCoachStudents(coachId),
        { initialProps: { coachId: coachId1 } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith(`/coaches/${coachId1}/students`);

      // Change coachId
      rerender({ coachId: coachId2 });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiClient.get).toHaveBeenCalledWith(`/coaches/${coachId2}/students`);
    });
  });

  describe('addStudent mutation', () => {
    it('should add a student to the coach', async () => {
      const coachId = 'coach-001';
      const newStudent = mockStudents[0];

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: newStudent,
      });

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let addedStudent;
      await act(async () => {
        addedStudent = await result.current.addStudent({
          studentId: 'student-001',
          batchId: 'batch-001',
        });
      });

      expect(apiClient.post).toHaveBeenCalledWith(`/coaches/${coachId}/students`, {
        studentId: 'student-001',
        batchId: 'batch-001',
      });

      expect(addedStudent?.fullName).toBe('Arjun Verma');
    });

    it('should refetch students after adding a student', async () => {
      const coachId = 'coach-001';
      const newStudent = mockStudents[0];

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: newStudent,
      });

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = (apiClient.get as ReturnType<typeof vi.fn>).mock.calls
        .length;

      await act(async () => {
        await result.current.addStudent({
          studentId: 'student-001',
          batchId: 'batch-001',
        });
      });

      // Should have called get twice: once on mount, once on refetch
      expect((apiClient.get as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
        initialCallCount
      );
    });

    it('should parse returned student dates correctly', async () => {
      const coachId = 'coach-001';
      const newStudentRaw = {
        ...mockStudents[0],
        dateOfBirth: mockStudents[0].dateOfBirth.toISOString(),
        createdAt: mockStudents[0].createdAt.toISOString(),
        updatedAt: mockStudents[0].updatedAt.toISOString(),
      };

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: newStudentRaw,
      });

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let addedStudent;
      await act(async () => {
        addedStudent = await result.current.addStudent({
          studentId: 'student-001',
          batchId: 'batch-001',
        });
      });

      expect(addedStudent?.dateOfBirth).toBeInstanceOf(Date);
      expect(addedStudent?.createdAt).toBeInstanceOf(Date);
      expect(addedStudent?.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error if API call fails', async () => {
      const coachId = 'coach-001';
      const apiError = new Error('Add student failed');

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let thrownError;
      await act(async () => {
        try {
          await result.current.addStudent({
            studentId: 'student-001',
            batchId: 'batch-001',
          });
        } catch (err) {
          thrownError = err;
        }
      });

      expect(thrownError).toBe(apiError);
    });

    it('should log error when adding student fails', async () => {
      const coachId = 'coach-001';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      const apiError = new Error('Add failed');

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.addStudent({
            studentId: 'student-001',
            batchId: 'batch-001',
          });
        } catch {
          // Expected to throw
        }
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to add student:', apiError);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('removeStudent mutation', () => {
    it('should remove a student from the coach', async () => {
      const coachId = 'coach-001';

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });
      (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.removeStudent({ studentId: 'student-001' });
      });

      expect(apiClient.delete).toHaveBeenCalledWith(
        `/coaches/${coachId}/students/student-001`
      );
    });

    it('should refetch students after removing a student', async () => {
      const coachId = 'coach-001';

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });
      (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = (apiClient.get as ReturnType<typeof vi.fn>).mock.calls
        .length;

      await act(async () => {
        await result.current.removeStudent({ studentId: 'student-001' });
      });

      // Should have called get at least twice: once on mount, once on refetch
      expect((apiClient.get as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
        initialCallCount
      );
    });

    it('should throw error if API call fails', async () => {
      const coachId = 'coach-001';
      const apiError = new Error('Remove student failed');

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });
      (apiClient.delete as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let thrownError;
      await act(async () => {
        try {
          await result.current.removeStudent({ studentId: 'student-001' });
        } catch (err) {
          thrownError = err;
        }
      });

      expect(thrownError).toBe(apiError);
    });

    it('should log error when removing student fails', async () => {
      const coachId = 'coach-001';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      const apiError = new Error('Remove failed');

      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });
      (apiClient.delete as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.removeStudent({ studentId: 'student-001' });
        } catch {
          // Expected to throw
        }
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to remove student:',
        apiError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('return object properties', () => {
    it('should return all expected properties', async () => {
      const coachId = 'coach-001';
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('students');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
      expect(result.current).toHaveProperty('addStudent');
      expect(result.current).toHaveProperty('removeStudent');
    });

    it('should return functions that are callable', async () => {
      const coachId = 'coach-001';
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockStudents,
      });

      const { result } = renderHook(() => useCoachStudents(coachId));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
      expect(typeof result.current.addStudent).toBe('function');
      expect(typeof result.current.removeStudent).toBe('function');
    });
  });
});

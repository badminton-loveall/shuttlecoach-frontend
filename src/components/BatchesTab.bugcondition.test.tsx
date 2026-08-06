import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import BatchesTab from './BatchesTab';
import apiClient from '../utils/apiClient';

/**
 * Bug Condition Exploration Test
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5
 *
 * Bug Condition: isBugCondition(X) = X.action = "EDIT_BATCH" OR X.action = "ADD_BATCH"
 *
 * This test MUST FAIL on unfixed code — failure confirms the bug exists.
 * The modal currently only shows Name and Schedule fields, but should show ALL fields:
 * Name, Schedule, Coach Assignment, Capacity, Skill Level, Monthly Fee,
 * Days of Week, Start Time, End Time, Description.
 */

vi.mock('../utils/apiClient');

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'] as const;
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const mockCoaches = [
  { id: 'coach-1', name: 'John Doe', role: 'HEAD_COACH' },
  { id: 'coach-2', name: 'Jane Smith', role: 'ASSISTANT_COACH' },
  { id: 'coach-3', name: 'Bob Wilson', role: 'HEAD_COACH' },
];

// Arbitrary for generating batch data used in Edit scenarios
const batchArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{2,20}$/),
  schedule: fc.constantFrom('Mon/Wed/Fri 6:00-7:30 AM', 'Tue/Thu 5:00-6:30 PM', 'Daily 8 AM'),
  assigned_coach_id: fc.constantFrom('coach-1', 'coach-2', 'coach-3'),
  coach_name: fc.constantFrom('John Doe', 'Jane Smith', 'Bob Wilson'),
  capacity: fc.integer({ min: 5, max: 50 }),
  skill_level: fc.constantFrom(...SKILL_LEVELS),
  monthly_fee: fc.integer({ min: 500, max: 10000 }),
  days_of_week: fc.subarray([...DAYS_OF_WEEK], { minLength: 1, maxLength: 7 }),
  start_time: fc.constantFrom('06:00', '07:00', '08:00', '16:00', '17:00'),
  end_time: fc.constantFrom('07:30', '08:30', '09:30', '17:30', '18:30'),
  description: fc.constantFrom('Morning training', 'Evening session', 'Advanced drills', 'Beginner group'),
  is_archived: fc.constant(false),
  created_at: fc.constant('2024-01-01T00:00:00Z'),
  updated_at: fc.constant('2024-01-01T00:00:00Z'),
});

// Action arbitrary: "ADD_BATCH" or "EDIT_BATCH"
const actionArbitrary = fc.constantFrom('ADD_BATCH', 'EDIT_BATCH');

describe('Bug Condition Exploration: Advanced Configuration Modal Fields', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('Property 1: ADD_BATCH modal contains all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant('ADD_BATCH'), async () => {
        // Setup mocks
        vi.mocked(apiClient.get).mockImplementation((url: string) => {
          if (url === '/batches') {
            return Promise.resolve({ data: { batches: [] } });
          }
          if (url === '/coaches') {
            return Promise.resolve({ data: { coaches: mockCoaches } });
          }
          return Promise.resolve({ data: {} });
        });

        const { unmount } = render(<BatchesTab readOnly={false} />);

        try {
          // Wait for batches to load
          await waitFor(() => {
            expect(screen.getByLabelText('Add Batch')).toBeInTheDocument();
          });

          // Open Add Batch modal
          fireEvent.click(screen.getByLabelText('Add Batch'));

          // Assert modal is open
          expect(screen.getByRole('heading', { name: 'Add Batch' })).toBeInTheDocument();

          // Assert ALL required fields exist in modal
          // 1. Name (text input)
          expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();

          // 2. Schedule (text input)
          expect(screen.getByLabelText(/Schedule/i)).toBeInTheDocument();

          // 3. Coach Assignment (dropdown)
          expect(screen.getByLabelText(/Coach/i)).toBeInTheDocument();

          // 4. Capacity (number input)
          expect(screen.getByLabelText(/Capacity/i)).toBeInTheDocument();

          // 5. Skill Level (select)
          expect(screen.getByLabelText(/Skill Level/i)).toBeInTheDocument();

          // 6. Monthly Fee (number input)
          expect(screen.getByLabelText(/Monthly Fee/i)).toBeInTheDocument();

          // 7. Days of Week (checkboxes)
          for (const day of DAYS_OF_WEEK) {
            expect(screen.getByLabelText(day)).toBeInTheDocument();
          }

          // 8. Start Time (time input)
          expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();

          // 9. End Time (time input)
          expect(screen.getByLabelText(/End Time/i)).toBeInTheDocument();

          // 10. Description (textarea)
          expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
        } finally {
          unmount();
          cleanup();
        }
      }),
      { numRuns: 1 }
    );
  });

  it('Property 1: EDIT_BATCH modal contains all required fields and pre-populates values', { timeout: 30000 }, async () => {
    // Use a deterministic batch for Edit test to avoid timing issues with arbitrary generation
    const editBatch = {
      id: 'test-edit-1',
      name: 'Advanced Training',
      schedule: 'Mon/Wed/Fri 6:00-7:30 AM',
      assigned_coach_id: 'coach-1',
      coach_name: 'John Doe',
      capacity: 20,
      skill_level: 'Intermediate',
      monthly_fee: 2500,
      days_of_week: ['Mon', 'Wed', 'Fri'],
      start_time: '06:00',
      end_time: '07:30',
      description: 'Advanced training batch',
      is_archived: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === '/batches') {
        return Promise.resolve({ data: { batches: [editBatch] } });
      }
      if (url === '/coaches') {
        return Promise.resolve({ data: { coaches: mockCoaches } });
      }
      return Promise.resolve({ data: {} });
    });

    const { unmount } = render(<BatchesTab readOnly={false} />);

    try {
      await waitFor(() => {
        expect(screen.getByText(editBatch.name)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(`Edit ${editBatch.name}`));

      // Assert modal is open with Edit title
      expect(screen.getByRole('heading', { name: 'Edit Batch' })).toBeInTheDocument();

      // Assert ALL required fields exist
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Schedule/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Coach/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Capacity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Skill Level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monthly Fee/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/End Time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();

      // Assert fields are pre-populated
      const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
      expect(nameInput.value).toBe(editBatch.name);

      const capacityInput = screen.getByLabelText(/Capacity/i) as HTMLInputElement;
      expect(capacityInput.value).toBe('20');

      const monthlyFeeInput = screen.getByLabelText(/Monthly Fee/i) as HTMLInputElement;
      expect(monthlyFeeInput.value).toBe('2500');
    } finally {
      unmount();
      cleanup();
    }
  });

  it('Property 1: Coach dropdown is populated via API fetch from /coaches endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(actionArbitrary, async (action) => {
        const mockBatches = [
          {
            id: '1',
            name: 'Morning Batch',
            schedule: 'Mon/Wed/Fri 6:00-7:30 AM',
            assigned_coach_id: 'coach-1',
            coach_name: 'John Doe',
            is_archived: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ];

        vi.mocked(apiClient.get).mockImplementation((url: string) => {
          if (url === '/batches') {
            return Promise.resolve({ data: { batches: mockBatches } });
          }
          if (url === '/coaches') {
            return Promise.resolve({ data: { coaches: mockCoaches } });
          }
          return Promise.resolve({ data: {} });
        });

        const { unmount } = render(<BatchesTab readOnly={false} />);

        try {
          await waitFor(() => {
            expect(screen.getByText('Morning Batch')).toBeInTheDocument();
          });

          // Open modal based on action
          if (action === 'ADD_BATCH') {
            fireEvent.click(screen.getByLabelText('Add Batch'));
          } else {
            fireEvent.click(screen.getByLabelText('Edit Morning Batch'));
          }

          // Assert /coaches endpoint was called
          expect(apiClient.get).toHaveBeenCalledWith('/coaches');

          // Assert coach dropdown contains coaches from both roles
          await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
          });
        } finally {
          unmount();
          cleanup();
        }
      }),
      { numRuns: 2 }
    );
  });
});

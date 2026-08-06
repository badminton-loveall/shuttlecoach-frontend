import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import BatchesTab from './BatchesTab';
import apiClient from '../utils/apiClient';

vi.mock('../utils/apiClient');

/**
 * Preservation Property Tests for BatchesTab
 *
 * These tests capture EXISTING behavior on UNFIXED code.
 * They validate that non-modal behaviors (delete, table, role-based access,
 * success messages, API errors, validation) remain unchanged after the fix.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 */

// Simple arbitrary for batch names (avoid special characters that break DOM queries)
const batchNameArb = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => s.trim().length > 0 && !/[<>&"']/.test(s))
  .map((s) => s.trim());

const scheduleArb = fc.oneof(
  fc.constant(null),
  fc
    .string({ minLength: 1, maxLength: 40 })
    .filter((s) => s.trim().length > 0 && !/[<>&"']/.test(s))
    .map((s) => s.trim())
);

const coachNameArb = fc.oneof(
  fc.constant(null),
  fc
    .string({ minLength: 1, maxLength: 30 })
    .filter((s) => s.trim().length > 0 && !/[<>&"']/.test(s))
    .map((s) => s.trim())
);

// Generate a single batch record
const batchRecordArb = fc
  .tuple(fc.uuid(), batchNameArb, scheduleArb, coachNameArb)
  .map(([id, name, schedule, coach_name]) => ({
    id,
    name,
    schedule,
    assigned_coach_id: coach_name ? `coach-${id}` : null,
    coach_name,
    is_archived: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }));

// Generate a list with unique names (required for aria-label queries)
const batchListArb = fc
  .array(batchRecordArb, { minLength: 1, maxLength: 3 })
  .filter((batches) => {
    const names = batches.map((b) => b.name);
    return new Set(names).size === names.length;
  });

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
  {
    id: '2',
    name: 'Evening Batch',
    schedule: 'Tue/Thu 5:00-6:30 PM',
    assigned_coach_id: null,
    coach_name: null,
    is_archived: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('BatchesTab Preservation Properties', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Property: Delete batch flow — Clicking Delete shows confirmation dialog;
   * confirming archives the batch via API call DELETE /batches/:id
   *
   * **Validates: Requirements 3.1**
   */
  describe('Property: Delete batch flow preservation', () => {
    it('clicking Delete shows confirmation dialog for any batch', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(batchListArb, async (batches) => {
          vi.resetAllMocks();
          vi.mocked(apiClient.get).mockResolvedValue({ data: { batches } });

          const { unmount } = render(<BatchesTab readOnly={false} />);

          await waitFor(() => {
            expect(screen.getByText(batches[0].name)).toBeInTheDocument();
          });

          // Click delete on first batch
          fireEvent.click(screen.getByLabelText(`Delete ${batches[0].name}`));

          // Confirmation dialog appears
          expect(screen.getByText('Delete Batch?')).toBeInTheDocument();
          expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();

          unmount();
          cleanup();
        }),
        { numRuns: 3 }
      );
    });

    it('confirming delete calls DELETE /batches/:id to archive the batch', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
      vi.mocked(apiClient.delete).mockResolvedValue({ data: { message: 'Batch archived' } });

      render(<BatchesTab readOnly={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Delete Morning Batch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Delete Morning Batch'));
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith('/batches/1');
      });
    });

    it('cancelling delete closes dialog without API call', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });

      render(<BatchesTab readOnly={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Delete Morning Batch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Delete Morning Batch'));
      expect(screen.getByText('Delete Batch?')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.queryByText('Delete Batch?')).not.toBeInTheDocument();
      });
      expect(apiClient.delete).not.toHaveBeenCalled();
    });
  });

  /**
   * Property: Batches table rendering — Table renders Name, Schedule, Coach, Actions
   * columns with correct data formatting
   *
   * **Validates: Requirements 3.2**
   */
  describe('Property: Batches table rendering preservation', () => {
    it('table displays batch names, formatted schedule, and formatted coach for any batch data', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(batchListArb, async (batches) => {
          vi.resetAllMocks();
          vi.mocked(apiClient.get).mockResolvedValue({ data: { batches } });

          const { unmount } = render(<BatchesTab readOnly={false} />);

          await waitFor(() => {
            expect(screen.getByText(batches[0].name)).toBeInTheDocument();
          });

          // Verify each batch row displays correctly
          for (const batch of batches) {
            // Name is displayed
            expect(screen.getByText(batch.name)).toBeInTheDocument();

            // Schedule formatting: "Schedule: X" or "—"
            if (batch.schedule) {
              expect(screen.getByText(`Schedule: ${batch.schedule}`)).toBeInTheDocument();
            }

            // Coach formatting: "Coach: X" or "—"
            if (batch.coach_name) {
              expect(screen.getByText(`Coach: ${batch.coach_name}`)).toBeInTheDocument();
            }
          }

          unmount();
          cleanup();
        }),
        { numRuns: 3 }
      );
    });

    it('table shows column headers Name, Schedule, Coach, Actions when not readOnly', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });

      render(<BatchesTab readOnly={false} />);

      await waitFor(() => {
        expect(screen.getByText('Morning Batch')).toBeInTheDocument();
      });

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Coach')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('null schedule or null coach_name displays as em-dash', async () => {
      // Use a batch with both schedule=null and coach_name=null
      const batchWithNulls = [
        {
          id: '99',
          name: 'Null Fields Batch',
          schedule: null,
          assigned_coach_id: null,
          coach_name: null,
          is_archived: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];
      vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: batchWithNulls } });

      render(<BatchesTab readOnly={false} />);

      await waitFor(() => {
        expect(screen.getByText('Null Fields Batch')).toBeInTheDocument();
      });

      // Both null schedule and null coach_name render as "—"
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBe(2);
    });
  });

  /**
   * Property: Role-based access (ASSISTANT_COACH/read-only) — When readOnly=true,
   * Add/Edit/Delete buttons are hidden
   *
   * **Validates: Requirements 3.4**
   */
  describe('Property: Role-based access preservation', () => {
    it('readOnly=true hides all action buttons for any batch list', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(batchListArb, async (batches) => {
          vi.resetAllMocks();
          vi.mocked(apiClient.get).mockResolvedValue({ data: { batches } });

          const { unmount } = render(<BatchesTab readOnly={true} />);

          await waitFor(() => {
            expect(screen.getByText(batches[0].name)).toBeInTheDocument();
          });

          // Add Batch button should not exist
          expect(screen.queryByLabelText('Add Batch')).not.toBeInTheDocument();

          // Edit/Delete buttons for each batch should not exist
          for (const batch of batches) {
            expect(screen.queryByLabelText(`Edit ${batch.name}`)).not.toBeInTheDocument();
            expect(screen.queryByLabelText(`Delete ${batch.name}`)).not.toBeInTheDocument();
          }

          // Actions column header should not be present
          expect(screen.queryByText('Actions')).not.toBeInTheDocument();

          unmount();
          cleanup();
        }),
        { numRuns: 3 }
      );
    });

    it('readOnly=false shows all action buttons for any batch list', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(batchListArb, async (batches) => {
          vi.resetAllMocks();
          vi.mocked(apiClient.get).mockResolvedValue({ data: { batches } });

          const { unmount } = render(<BatchesTab readOnly={false} />);

          await waitFor(() => {
            expect(screen.getByText(batches[0].name)).toBeInTheDocument();
          });

          // Add Batch button should be present
          expect(screen.getByLabelText('Add Batch')).toBeInTheDocument();

          // Edit/Delete buttons for each batch should be present
          for (const batch of batches) {
            expect(screen.getByLabelText(`Edit ${batch.name}`)).toBeInTheDocument();
            expect(screen.getByLabelText(`Delete ${batch.name}`)).toBeInTheDocument();
          }

          unmount();
          cleanup();
        }),
        { numRuns: 3 }
      );
    });
  });

  /**
   * Property: Success messages — Successful create/update/delete shows success message (role="status")
   *
   * **Validates: Requirements 3.5**
   */
  describe('Property: Success messages preservation', () => {
    it('successful create shows success message with role="status"', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
      vi.mocked(apiClient.post).mockResolvedValue({ data: { id: '3', name: 'New Batch' } });

      render(<BatchesTab readOnly={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Add Batch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Add Batch'));
      fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'New Batch' } });
      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        const successEl = screen.getByRole('status');
        expect(successEl).toHaveTextContent('Batch created successfully');
      });
    });

    it('successful update shows success message with role="status"', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { id: '1', name: 'Updated' } });

      render(<BatchesTab readOnly={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Edit Morning Batch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Edit Morning Batch'));
      fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Updated Batch' } });
      fireEvent.click(screen.getByText('Update'));

      await waitFor(() => {
        const successEl = screen.getByRole('status');
        expect(successEl).toHaveTextContent('Batch updated successfully');
      });
    });

    it('successful delete shows success message with role="status"', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
      vi.mocked(apiClient.delete).mockResolvedValue({ data: { message: 'Archived' } });

      render(<BatchesTab readOnly={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Delete Morning Batch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Delete Morning Batch'));
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        const successEl = screen.getByRole('status');
        expect(successEl).toHaveTextContent('Batch deleted successfully');
      });
    });
  });

  /**
   * Property: API validation errors — When API returns field-level errors, they display in the form
   *
   * **Validates: Requirements 3.6**
   */
  describe('Property: API validation errors preservation', () => {
    it('API field-level errors display in the form for any error message', { timeout: 15000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 40 }).filter((s) => s.trim().length > 0 && !/[<>&"']/.test(s)),
          async (errorMessage) => {
            vi.resetAllMocks();
            vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
            vi.mocked(apiClient.post).mockRejectedValue({
              response: {
                data: {
                  errors: [{ field: 'name', message: errorMessage }],
                },
              },
            });

            const { unmount } = render(<BatchesTab readOnly={false} />);

            await waitFor(() => {
              expect(screen.getByLabelText('Add Batch')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Add Batch'));
            fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test' } });
            fireEvent.click(screen.getByText('Create'));

            await waitFor(() => {
              expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });

            unmount();
            cleanup();
          }
        ),
        { numRuns: 3 }
      );
    });

    it('API schedule field errors display correctly', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });
      vi.mocked(apiClient.post).mockRejectedValue({
        response: {
          data: {
            errors: [{ field: 'schedule', message: 'Invalid schedule format' }],
          },
        },
      });

      render(<BatchesTab readOnly={false} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Add Batch')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Add Batch'));
      fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText('Schedule'), { target: { value: 'bad format' } });
      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByText('Invalid schedule format')).toBeInTheDocument();
      });
    });
  });

  /**
   * Property: Empty name validation — Submitting form with empty name triggers "Name is required" error
   *
   * **Validates: Requirements 3.3**
   */
  describe('Property: Empty name validation preservation', () => {
    it('submitting with empty/whitespace name triggers "Name is required" error', { timeout: 15000 }, async () => {
      // Test with empty string and various whitespace-only strings
      const whitespaceValues = ['', ' ', '  ', '   ', '\t', ' \t '];

      for (const whitespace of whitespaceValues) {
        vi.resetAllMocks();
        vi.mocked(apiClient.get).mockResolvedValue({ data: { batches: mockBatches } });

        const { unmount } = render(<BatchesTab readOnly={false} />);

        await waitFor(() => {
          expect(screen.getByLabelText('Add Batch')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText('Add Batch'));

        // Set name to empty or whitespace-only
        if (whitespace.length > 0) {
          fireEvent.change(screen.getByLabelText('Name *'), { target: { value: whitespace } });
        }

        fireEvent.click(screen.getByText('Create'));

        // Validation error should appear
        expect(screen.getByText('Name is required')).toBeInTheDocument();

        // API should NOT be called
        expect(apiClient.post).not.toHaveBeenCalled();

        unmount();
        cleanup();
      }
    });
  });
});

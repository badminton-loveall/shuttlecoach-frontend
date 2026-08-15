import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WizardProvider, INITIAL_WIZARD_STATE, useWizard } from '../components/batch-wizard/WizardContext';
import type { WizardState } from '../components/batch-wizard/WizardContext';
import WizardShell from '../components/batch-wizard/WizardShell';
import { ScheduleStep } from '../components/batch-wizard/ScheduleStep';
import { CurriculumStep } from '../components/batch-wizard/CurriculumStep';
import { CoachStep } from '../components/batch-wizard/CoachStep';
import { DetailsStep } from '../components/batch-wizard/DetailsStep';
import { DashboardLayout } from '../components/DashboardLayout';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import apiClient from '../utils/apiClient';
import type { Batch } from '../types';

/**
 * BatchWizardPage
 * Full-page wizard for batch creation and editing.
 * - /batches/new → create mode (empty state)
 * - /batches/:id/edit → edit mode (pre-populated from existing batch)
 * Requirements: 1.1, 6.1, 6.2, 7.1
 */

/**
 * Maps an existing batch record to WizardState for edit mode.
 * All four steps are marked as completed since the batch already has data.
 */
function batchToWizardState(batch: Batch & Record<string, unknown>): WizardState {
  return {
    mode: 'edit',
    batchId: batch.id,
    currentStep: 0,
    completedSteps: new Set([0, 1, 2, 3]),
    schedule: {
      templateId: (batch.template_id as string) ?? null,
      templateName: (batch.template_name as string) ?? null,
      daysOfWeek: Array.isArray(batch.days_of_week)
        ? (batch.days_of_week as number[])
        : [],
      startTime: (batch.start_time as string) ?? '',
      duration: typeof batch.duration === 'number' ? batch.duration : 0,
      isNewTemplate: false,
    },
    curriculum: {
      courseId: (batch.curriculum_id as string) ?? null,
      courseName: (batch.curriculum_name as string) ?? null,
      weekCount: typeof batch.week_count === 'number' ? batch.week_count : null,
    },
    coach: {
      coachId: (batch.assigned_coach_id as string) ?? (batch.assignedCoachId as string) ?? null,
      coachName: (batch.coach_name as string) ?? null,
      coachRole: (batch.coach_role as string) ?? null,
    },
    details: {
      name: batch.name,
      skillLevel: (batch.skill_level as WizardState['details']['skillLevel']) ?? '',
      capacity: typeof batch.capacity === 'number' ? batch.capacity : '',
    },
  };
}

// ─── Inner Wizard Content ────────────────────────────────────────────────────

/**
 * WizardContent — inner component rendered inside WizardProvider.
 * Has access to useWizard() for getSubmitPayload and rendering steps.
 */
interface WizardContentProps {
  isEditMode: boolean;
  batchId?: string;
  title: string;
  onCancel: () => void;
  onSuccess: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

const WizardContent: React.FC<WizardContentProps> = ({
  isEditMode,
  batchId,
  title,
  onCancel,
  onSuccess,
  onDirtyChange,
}) => {
  const { state, getSubmitPayload } = useWizard();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track dirty state: any change to wizard state after initial render
  const initialRef = React.useRef(true);
  useEffect(() => {
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }
    onDirtyChange(true);
  }, [state, onDirtyChange]);

  /**
   * handleSubmit — called when user clicks "Create Batch" / "Save Changes"
   * 1. Get payload from wizard context
   * 2. If newTemplate exists, POST it first to get template_id
   * 3. POST or PATCH the batch
   */
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const payload = getSubmitPayload();

      // Build the final batch API payload
      const batchPayload: Record<string, unknown> = {
        name: payload.name,
      };

      // Handle new template creation flow
      if (payload.newTemplate) {
        // Transform days_of_week (number[]) into slots array format expected by API
        const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
        const slots = payload.newTemplate.days_of_week
          .slice()
          .sort((a, b) => a - b)
          .map((dayIndex) => ({
            day_of_week: DAY_NAMES[dayIndex],
            start_time: payload.newTemplate!.start_time,
            duration_hours: Math.floor(payload.newTemplate!.duration),
          }));

        const templateResponse = await apiClient.post<{ id: string }>('/batch-time-templates', {
          name: payload.newTemplate.name,
          slots,
        });
        batchPayload.template_id = templateResponse.data.id;
      } else if (payload.template_id) {
        batchPayload.template_id = payload.template_id;
      }

      if (payload.curriculum_id) {
        batchPayload.curriculum_id = payload.curriculum_id;
      }
      if (payload.assigned_coach_id) {
        batchPayload.assigned_coach_id = payload.assigned_coach_id;
      }
      if (payload.skill_level) {
        batchPayload.skill_level = payload.skill_level;
      }
      if (payload.capacity) {
        batchPayload.capacity = payload.capacity;
      }

      // Create or update
      if (isEditMode && batchId) {
        await apiClient.patch(`/batches/${batchId}`, batchPayload);
        showToast({ message: 'Batch updated successfully.', type: 'success' });
      } else {
        await apiClient.post('/batches', batchPayload);
        showToast({ message: 'Batch created successfully.', type: 'success' });
      }

      onDirtyChange(false);
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An error occurred. Please try again.';
      showToast({ message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [getSubmitPayload, isEditMode, batchId, showToast, onSuccess, onDirtyChange]);

  return (
    <WizardShell
      title={title}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      {state.currentStep === 0 && <ScheduleStep />}
      {state.currentStep === 1 && <CurriculumStep />}
      {state.currentStep === 2 && <CoachStep />}
      {state.currentStep === 3 && <DetailsStep />}
    </WizardShell>
  );
};

// ─── Page Component ──────────────────────────────────────────────────────────

const BatchWizardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isEditMode = Boolean(id);

  const [initialState, setInitialState] = useState<WizardState | null>(
    isEditMode ? null : INITIAL_WIZARD_STATE
  );
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Fetch batch data for edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchBatch = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<{ batches: Record<string, unknown>[] }>('/batches');
        const batch = response.data.batches.find(
          (b) => b.id === id
        );

        if (!batch) {
          showToast({ message: 'Batch not found.', type: 'error' });
          navigate('/batches', { replace: true });
          return;
        }

        setInitialState(batchToWizardState(batch as Batch & Record<string, unknown>));
      } catch {
        setError('Failed to load batch. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void fetchBatch();
  }, [id, isEditMode, navigate, showToast]);

  // beforeunload listener for dirty state
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Cancel handler — show confirmation modal if dirty, otherwise navigate away
  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate('/batches');
    }
  }, [isDirty, navigate]);

  const handleConfirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    navigate('/batches');
  }, [navigate]);

  const handleDismissCancel = useCallback(() => {
    setShowCancelConfirm(false);
  }, []);

  // Success handler — navigate to batch list
  const handleSuccess = useCallback(() => {
    navigate('/batches');
  }, [navigate]);

  // Track dirty state
  const handleDirtyChange = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  // Memoize the mode label
  const pageTitle = useMemo(
    () => (isEditMode ? 'Edit Batch' : 'Create Batch'),
    [isEditMode]
  );

  // Loading state for edit mode
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading batch...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/batches')}
              className="text-sm text-primary underline"
            >
              Return to Batches
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Don't render until initial state is ready
  if (!initialState) return null;

  return (
    <DashboardLayout>
      <WizardProvider initialState={initialState}>
        <WizardContent
          isEditMode={isEditMode}
          batchId={id}
          title={pageTitle}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
          onDirtyChange={handleDirtyChange}
        />
      </WizardProvider>
      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to leave? All progress will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        variant="danger"
        onConfirm={handleConfirmCancel}
        onCancel={handleDismissCancel}
      />
    </DashboardLayout>
  );
};

export default BatchWizardPage;

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CoachListTable from '../components/CoachListTable';
import AddCoachModal, { type CoachFormData } from '../components/AddCoachModal';
import EditCoachModal, { type EditCoachFormData } from '../components/EditCoachModal';
import DeleteCoachConfirmDialog from '../components/DeleteCoachConfirmDialog';
import AssignmentPanel from '../components/AssignmentPanel';
import { useRoleGuard } from '../hooks/useRoleGuard';
import { useCoaches } from '../hooks/useCoaches';
import { useStudents } from '../hooks/useStudents';
import apiClient from '../utils/apiClient';
import type { User, Student, Batch } from '../types';

/**
 * CoachManagementPage (CoachesPage)
 * Manages assistant coaches - accessible only to Head Coach
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9
 *
 * Features:
 * - Displays list of assistant coaches
 * - Shows assignment statistics (batches, students)
 * - Shows last active timestamp
 * - Add assistant coach functionality with modal form
 * - Coach selection for assignment management
 * - AssignmentPanel for managing batch and student assignments
 * - Enforces Head Coach-only access via useRoleGuard
 */

export const CoachesPage: React.FC = () => {
  // Enforce Head Coach-only access
  useRoleGuard(['HEAD_COACH']);

  const { coaches: rawCoaches, loading: coachesLoading, error: coachesError, createCoach, refetch: refetchCoaches } = useCoaches();
  const { students, loading: studentsLoading, refetch: refetchStudents } = useStudents();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local fee access overrides — maps coachId to canAccessFees for optimistic UI
  const [feeAccessOverrides, setFeeAccessOverrides] = useState<Record<string, boolean>>({});

  // Merge overrides into coaches list
  const coaches = rawCoaches.map((coach) => ({
    ...coach,
    canAccessFees: feeAccessOverrides[coach.id] ?? coach.canAccessFees,
  }));

  // Sync overrides when rawCoaches changes (e.g., after refetch)
  useEffect(() => {
    setFeeAccessOverrides({});
  }, [rawCoaches]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<User | null>(null);
  const [coachToEdit, setCoachToEdit] = useState<User | null>(null);
  const [coachToDelete, setCoachToDelete] = useState<User | null>(null);

  // Load batches from API on mount (no useBatches hook yet)
  useEffect(() => {
    const loadBatches = async () => {
      try {
        setBatchesLoading(true);
        const response = await apiClient.get<Batch[]>('/batches');
        const parsed = response.data.map((batch) => ({
          ...batch,
          createdAt: new Date(batch.createdAt),
        }));
        setBatches(parsed);
      } catch {
        // Batches endpoint may not exist yet - that's okay
        setBatches([]);
      } finally {
        setBatchesLoading(false);
      }
    };
    void loadBatches();
  }, []);

  const loading = coachesLoading || studentsLoading || batchesLoading;

  // Propagate hook errors
  useEffect(() => {
    if (coachesError) setError(coachesError);
  }, [coachesError]);

  // Handle add coach submission
  const handleAddCoach = async (coachData: CoachFormData) => {
    await createCoach({
      username: coachData.username,
      password: coachData.password,
      name: coachData.name,
      email: coachData.email,
      profilePhoto: coachData.profilePhoto,
      specialization: coachData.specialization,
    });
    setIsAddModalOpen(false);
  };

  // Handle assignment changes — AssignmentPanel calls the API internally,
  // so we just refetch both hooks to get fresh data.
  const handleAssignmentChange = async (_updatedStudents: Student[], _updatedBatches: Batch[]) => {
    try {
      await Promise.all([refetchCoaches(), refetchStudents()]);
    } catch (err) {
      console.error('Error refreshing after assignment change:', err);
      setError('Failed to refresh data after assignment update.');
    }
  };

  // Handle coach selection
  const handleCoachSelect = (coach: User) => {
    setSelectedCoach(coach.id === selectedCoach?.id ? null : coach);
  };

  // Handle edit coach
  const handleEditCoach = (coach: User) => {
    setCoachToEdit(coach);
    setIsEditModalOpen(true);
  };

  // Handle edit coach submission
  const handleEditCoachSubmit = async (coachId: string, coachData: EditCoachFormData) => {
    await apiClient.patch(`/coaches/${coachId}`, coachData);
    await refetchCoaches();

    // Keep selectedCoach in sync
    if (selectedCoach?.id === coachId) {
      const updated = coaches.find((c) => c.id === coachId);
      setSelectedCoach(updated ?? null);
    }

    setIsEditModalOpen(false);
    setCoachToEdit(null);
  };

  // Handle delete coach
  const handleDeleteCoach = (coach: User) => {
    setCoachToDelete(coach);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete coach confirmation
  const handleDeleteCoachConfirm = async (coachId: string) => {
    await apiClient.delete(`/coaches/${coachId}`);
    await Promise.all([refetchCoaches(), refetchStudents()]);

    if (selectedCoach?.id === coachId) {
      setSelectedCoach(null);
    }

    setIsDeleteDialogOpen(false);
    setCoachToDelete(null);
  };

  // Calculate stats for coach to delete
  const getCoachStatsForDelete = (coach: User | null) => {
    if (!coach) return { batchCount: 0, studentCount: 0 };
    const batchCount = batches.filter((b) => b.assignedCoachId === coach.id).length;
    const studentCount = students.filter((s) => s.assignedCoachId === coach.id).length;
    return { batchCount, studentCount };
  };

  const deleteStats = getCoachStatsForDelete(coachToDelete);

  // Handle fee access toggle — update local state optimistically
  const handleFeeAccessToggle = (coachId: string, value: boolean) => {
    setFeeAccessOverrides((prev) => ({ ...prev, [coachId]: value }));
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Coach Management</h1>
              <p className="page-header-subtitle">View and manage assistant coaches and their assignments</p>
            </div>

            {/* Add Coach Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-create-fee"
              title="Add new assistant coach"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Assistant Coach
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="card" style={{ padding: 'var(--space-xl)' }}>
              <div className="animate-pulse flex flex-col" style={{ gap: 'var(--space-md)' }}>
                <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--border-default)' }}></div>
                <div className="h-4 rounded" style={{ backgroundColor: 'var(--border-default)' }}></div>
                <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--border-default)' }}></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-md" style={{ backgroundColor: 'var(--feedback-danger-light)', border: '1px solid var(--color-danger-light)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
              <p className="text-small" style={{ color: 'var(--color-danger-text)' }}>{error}</p>
            </div>
          )}

          {/* Coach List Table */}
          {!loading && !error && (
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <CoachListTable
                coaches={coaches}
                students={students}
                batches={batches}
                selectedCoachId={selectedCoach?.id}
                onCoachSelect={handleCoachSelect}
                onEditCoach={handleEditCoach}
                onDeleteCoach={handleDeleteCoach}
                onFeeAccessToggle={handleFeeAccessToggle}
              />
            </div>
          )}

          {/* Assignment Panel */}
          {!loading && !error && (
            <AssignmentPanel
              selectedCoach={selectedCoach}
              students={students}
              batches={batches}
              onAssignmentChange={handleAssignmentChange}
            />
          )}

          {/* Add Coach Modal */}
          <AddCoachModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddCoach}
          />

          {/* Edit Coach Modal */}
          <EditCoachModal
            isOpen={isEditModalOpen}
            coach={coachToEdit}
            onClose={() => {
              setIsEditModalOpen(false);
              setCoachToEdit(null);
            }}
            onSubmit={handleEditCoachSubmit}
          />

          {/* Delete Coach Confirmation Dialog */}
          <DeleteCoachConfirmDialog
            isOpen={isDeleteDialogOpen}
            coach={coachToDelete}
            assignedBatchCount={deleteStats.batchCount}
            assignedStudentCount={deleteStats.studentCount}
            onClose={() => {
              setIsDeleteDialogOpen(false);
              setCoachToDelete(null);
            }}
            onConfirm={handleDeleteCoachConfirm}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoachesPage;

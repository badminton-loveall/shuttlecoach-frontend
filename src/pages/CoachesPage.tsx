import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import CoachListTable from '../components/CoachListTable';
import AddCoachModal, { type CoachFormData } from '../components/AddCoachModal';
import EditCoachModal, { type EditCoachFormData } from '../components/EditCoachModal';
import DeleteCoachConfirmDialog from '../components/DeleteCoachConfirmDialog';
import AssignmentPanel from '../components/AssignmentPanel';
import { useRoleGuard } from '../hooks/useRoleGuard';
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

  const [coaches, setCoaches] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<User | null>(null);
  const [coachToEdit, setCoachToEdit] = useState<User | null>(null);
  const [coachToDelete, setCoachToDelete] = useState<User | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load users (coaches)
        const usersResponse = await fetch('/src/data/users.json');
        const usersData = (await usersResponse.json()) as User[];
        
        // Convert date strings to Date objects
        const parsedUsers = usersData.map((user) => ({
          ...user,
          createdAt: new Date(user.createdAt),
          lastActive: new Date(user.lastActive),
        }));
        
        setCoaches(parsedUsers);

        // Load students
        const studentsResponse = await fetch('/src/data/students.json');
        const studentsData = (await studentsResponse.json()) as Student[];
        
        // Convert date strings to Date objects
        const parsedStudents = studentsData.map((student) => ({
          ...student,
          dateOfBirth: new Date(student.dateOfBirth),
          createdAt: new Date(student.createdAt),
          updatedAt: new Date(student.updatedAt),
        }));
        
        setStudents(parsedStudents);

        // Load batches (if available)
        try {
          const batchesResponse = await fetch('/src/data/batches.json');
          if (batchesResponse.ok) {
            const batchesData = (await batchesResponse.json()) as Batch[];
            const parsedBatches = batchesData.map((batch) => ({
              ...batch,
              createdAt: new Date(batch.createdAt),
            }));
            setBatches(parsedBatches);
          }
        } catch {
          // Batches file might not exist yet - that's okay
          setBatches([]);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load coach data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate unique ID for new coach
  const generateCoachId = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `user-${timestamp}-${random}`;
  };

  // Handle add coach submission
  const handleAddCoach = async (coachData: CoachFormData) => {
    try {
      // Create new coach object
      const newCoach: User = {
        id: generateCoachId(),
        username: coachData.username,
        role: 'ASSISTANT_COACH',
        name: coachData.name,
        email: coachData.email || undefined,
        profilePhoto: coachData.profilePhoto || undefined,
        specialization: coachData.specialization || undefined,
        createdAt: new Date(),
        lastActive: new Date(),
      };

      // Load current coaches from localStorage/JSON
      const storedCoaches = localStorage.getItem('coaches');
      let coachesData: User[];

      if (storedCoaches) {
        coachesData = JSON.parse(storedCoaches);
      } else {
        // Load from JSON file if not in localStorage
        const response = await fetch('/src/data/users.json');
        coachesData = await response.json();
      }

      // Add new coach
      coachesData.push(newCoach);

      // Save to localStorage (simulating JSON update)
      localStorage.setItem('coaches', JSON.stringify(coachesData));

      // Update state with new coach
      setCoaches((prevCoaches) => [...prevCoaches, newCoach]);

      // Close modal
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding coach:', err);
      throw new Error('Failed to add coach. Please try again.');
    }
  };

  // Handle assignment changes
  const handleAssignmentChange = async (updatedStudents: Student[], updatedBatches: Batch[]) => {
    try {
      // Update students state
      setStudents(updatedStudents);
      
      // Update batches state
      setBatches(updatedBatches);
      
      // Save students to localStorage (simulating JSON update)
      const studentsForStorage = updatedStudents.map((student) => ({
        ...student,
        dateOfBirth: student.dateOfBirth.toISOString(),
        createdAt: student.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      localStorage.setItem('students', JSON.stringify(studentsForStorage));
      
      // Save batches to localStorage
      const batchesForStorage = updatedBatches.map((batch) => ({
        ...batch,
        createdAt: batch.createdAt.toISOString(),
      }));
      localStorage.setItem('batches', JSON.stringify(batchesForStorage));
    } catch (err) {
      console.error('Error updating assignments:', err);
      setError('Failed to update assignments. Please try again.');
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
    try {
      // Update coach in coaches array
      const updatedCoaches = coaches.map((coach) =>
        coach.id === coachId
          ? {
              ...coach,
              name: coachData.name,
              username: coachData.username,
              email: coachData.email,
              specialization: coachData.specialization,
              profilePhoto: coachData.profilePhoto,
              updatedAt: new Date(),
            }
          : coach
      );

      setCoaches(updatedCoaches);

      // Save to localStorage (simulating JSON update)
      localStorage.setItem('coaches', JSON.stringify(updatedCoaches));

      // Update selected coach if it was the one being edited
      if (selectedCoach?.id === coachId) {
        setSelectedCoach(updatedCoaches.find((c) => c.id === coachId) || null);
      }

      setIsEditModalOpen(false);
      setCoachToEdit(null);
    } catch (err) {
      console.error('Error updating coach:', err);
      throw new Error('Failed to update coach. Please try again.');
    }
  };

  // Handle delete coach
  const handleDeleteCoach = (coach: User) => {
    setCoachToDelete(coach);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete coach confirmation
  const handleDeleteCoachConfirm = async (coachId: string) => {
    try {
      // Remove coach from coaches array
      const updatedCoaches = coaches.filter((coach) => coach.id !== coachId);
      setCoaches(updatedCoaches);

      // Unassign all students from this coach
      const updatedStudents = students.map((student) =>
        student.assignedCoachId === coachId
          ? { ...student, assignedCoachId: undefined }
          : student
      );
      setStudents(updatedStudents);

      // Unassign all batches from this coach
      const updatedBatches = batches.map((batch) =>
        batch.assignedCoachId === coachId
          ? { ...batch, assignedCoachId: undefined }
          : batch
      );
      setBatches(updatedBatches);

      // Save to localStorage (simulating JSON update)
      localStorage.setItem('coaches', JSON.stringify(updatedCoaches));
      
      const studentsForStorage = updatedStudents.map((student) => ({
        ...student,
        dateOfBirth: student.dateOfBirth.toISOString(),
        createdAt: student.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      localStorage.setItem('students', JSON.stringify(studentsForStorage));
      
      const batchesForStorage = updatedBatches.map((batch) => ({
        ...batch,
        createdAt: batch.createdAt.toISOString(),
      }));
      localStorage.setItem('batches', JSON.stringify(batchesForStorage));

      // Clear selected coach if it was deleted
      if (selectedCoach?.id === coachId) {
        setSelectedCoach(null);
      }

      setIsDeleteDialogOpen(false);
      setCoachToDelete(null);
    } catch (err) {
      console.error('Error deleting coach:', err);
      throw new Error('Failed to delete coach. Please try again.');
    }
  };

  // Calculate stats for coach to delete
  const getCoachStatsForDelete = (coach: User | null) => {
    if (!coach) return { batchCount: 0, studentCount: 0 };
    
    const batchCount = batches.filter((b) => b.assignedCoachId === coach.id).length;
    const studentCount = students.filter((s) => s.assignedCoachId === coach.id).length;
    
    return { batchCount, studentCount };
  };

  const deleteStats = getCoachStatsForDelete(coachToDelete);

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Coach List Table */}
          {!loading && !error && (
            <div className="mb-6">
              <CoachListTable 
                coaches={coaches} 
                students={students} 
                batches={batches}
                selectedCoachId={selectedCoach?.id}
                onCoachSelect={handleCoachSelect}
                onEditCoach={handleEditCoach}
                onDeleteCoach={handleDeleteCoach}
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

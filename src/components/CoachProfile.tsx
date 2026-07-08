import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { User, Student, Batch, FeeRecord, Expense } from '../types';
import CoachProfileTab from './CoachProfileTab';
import { CoachBatchesTab } from './CoachBatchesTab';
import CoachStudentsTab from './CoachStudentsTab';
import CoachPaymentsTab from './CoachPaymentsTab';
import './CoachProfile.css';

/**
 * CoachProfile Component
 * Displays coach information with multiple tabs:
 * - Profile: Coach details (read-only mode)
 * - Batches: Assigned batches management
 * - Students: Assigned students management
 * - Payments: Coach payment records and expenses
 * 
 * Task 13.5: Data update callbacks wired to all tabs
 * - onUpdateCoach: Updates coach profile
 * - onBatchAssigned/onBatchUnassigned: Manages batch assignments
 * - onStudentAdded/onStudentRemoved: Manages student assignments
 * - Expense callbacks: Manages expense records
 */

interface CoachProfileProps {
  coach: User | null;
  students: Student[];
  batches: Batch[];
  fees: FeeRecord[];
  expenses?: Expense[];
  onUpdateCoach: (coachData: Partial<User>) => Promise<void>;
  onBatchAssigned?: (batchId: string) => Promise<void>;
  onBatchUnassigned?: (batchId: string) => Promise<void>;
  onStudentAdded?: (studentId: string) => Promise<void>;
  onStudentRemoved?: (studentId: string) => Promise<void>;
  onExpenseAdded?: (expense: Expense) => Promise<void>;
  onExpenseUpdated?: (expense: Expense) => Promise<void>;
  onExpenseDeleted?: (expenseId: string) => Promise<void>;
  onRefetchData?: () => Promise<void>;
}

type TabType = 'profile' | 'batches' | 'students' | 'payments';

export const CoachProfile: React.FC<CoachProfileProps> = ({
  coach,
  students,
  batches,
  fees,
  expenses = [],
  onUpdateCoach,
  onBatchAssigned,
  onBatchUnassigned,
  onStudentAdded,
  onStudentRemoved,
  onExpenseDeleted,
  onRefetchData,
}) => {
  const { role: userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  /**
   * Handle batch assignment with callback and refetch
   * Requirements: 6.6, 20.2
   */
  const handleBatchAssigned = useCallback(async (batchId: string) => {
    try {
      if (onBatchAssigned) {
        await onBatchAssigned(batchId);
      }
      // Refetch data to update UI with new batch
      if (onRefetchData) {
        await onRefetchData();
      }
    } catch (err) {
      console.error('Error handling batch assignment:', err);
    }
  }, [onBatchAssigned, onRefetchData]);

  /**
   * Handle batch unassignment with callback and refetch
   * Requirements: 6.6, 20.2
   */
  const handleBatchUnassigned = useCallback(async (batchId: string) => {
    try {
      if (onBatchUnassigned) {
        await onBatchUnassigned(batchId);
      }
      // Refetch data to update UI after batch removal
      if (onRefetchData) {
        await onRefetchData();
      }
    } catch (err) {
      console.error('Error handling batch unassignment:', err);
    }
  }, [onBatchUnassigned, onRefetchData]);

  /**
   * Handle student addition with callback and refetch
   * Requirements: 9.6, 20.3
   */
  const handleStudentAdded = useCallback(async (studentId: string) => {
    try {
      if (onStudentAdded) {
        await onStudentAdded(studentId);
      }
      // Refetch data to update student list and header count
      if (onRefetchData) {
        await onRefetchData();
      }
    } catch (err) {
      console.error('Error handling student addition:', err);
    }
  }, [onStudentAdded, onRefetchData]);

  /**
   * Handle student removal with callback and refetch
   * Requirements: 9.6, 20.3
   */
  const handleStudentRemoved = useCallback(async (studentId: string) => {
    try {
      if (onStudentRemoved) {
        await onStudentRemoved(studentId);
      }
      // Refetch data to update student list and header count
      if (onRefetchData) {
        await onRefetchData();
      }
    } catch (err) {
      console.error('Error handling student removal:', err);
    }
  }, [onStudentRemoved, onRefetchData]);

  /**
   * Handle expense deletion with callback and refetch
   * Requirements: 15.7, 20.4
   */
  const handleExpenseDeleted = useCallback(async (expenseId: string) => {
    try {
      if (onExpenseDeleted) {
        await onExpenseDeleted(expenseId);
      }
      // Refetch data to update expense list and financial summaries
      if (onRefetchData) {
        await onRefetchData();
      }
    } catch (err) {
      console.error('Error handling expense deletion:', err);
    }
  }, [onExpenseDeleted, onRefetchData]);

  if (!coach) {
    return (
      <div className="coach-profile-empty">
        <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="empty-text">Select a coach to view profile</p>
      </div>
    );
  }

  // Calculate coach stats
  const assignedBatches = batches.filter((b) => b.assignedCoachId === coach.id);
  const assignedStudents = students.filter((s) => s.assignedCoachId === coach.id);

  // Default to HEAD_COACH if userRole is not available
  const displayUserRole = userRole || 'HEAD_COACH';

  return (
    <div className="coach-profile">
      {/* Header with Coach Info */}
      <div className="coach-profile-header">
        <div className="coach-profile-avatar">
          {coach.profilePhoto ? (
            <img src={coach.profilePhoto} alt={coach.name} />
          ) : (
            <div className="avatar-placeholder">
              {coach.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="coach-profile-info">
          <h2 className="coach-profile-name">{coach.name}</h2>
          <p className="coach-profile-meta">{coach.email || 'No email'}</p>
          
          <div className="coach-profile-stats">
            <div className="stat-item">
              <span className="stat-label">Batches</span>
              <span className="stat-value">{assignedBatches.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Students</span>
              <span className="stat-value">{assignedStudents.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Specialization</span>
              <span className="stat-value">{coach.specialization || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="coach-profile-tabs">
        <button
          onClick={() => setActiveTab('profile')}
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Profile
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`tab-button ${activeTab === 'batches' ? 'active' : ''}`}
        >
          <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Batches ({assignedBatches.length})
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
        >
          <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Students ({assignedStudents.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
        >
          <svg className="tab-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Payments
        </button>
      </div>

      {/* Tab Content */}
      <div className="coach-profile-content">
        {activeTab === 'profile' && (
          <CoachProfileTab
            coach={coach}
            userRole={displayUserRole}
            onUpdateCoach={onUpdateCoach}
          />
        )}

        {activeTab === 'batches' && (
          <CoachBatchesTab
            batches={assignedBatches}
            userRole={displayUserRole}
            coachId={coach.id}
            onBatchAssigned={handleBatchAssigned}
            onBatchUnassigned={handleBatchUnassigned}
          />
        )}

        {activeTab === 'students' && (
          <CoachStudentsTab
            students={assignedStudents}
            coachId={coach.id}
            userRole={displayUserRole}
            batches={assignedBatches}
            onStudentAdded={handleStudentAdded}
            onStudentRemoved={handleStudentRemoved}
          />
        )}

        {activeTab === 'payments' && (
          <CoachPaymentsTab 
            coachId={coach.id} 
            fees={fees} 
            expenses={expenses} 
            students={students}
            onExpenseDeleted={handleExpenseDeleted}
            userRole={displayUserRole}
          />
        )}
      </div>
    </div>
  );
};

export default CoachProfile;

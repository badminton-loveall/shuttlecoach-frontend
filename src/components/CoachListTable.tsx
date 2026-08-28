import React from 'react';
import FeeAccessToggle from './FeeAccessToggle';
import type { User, Student, Batch } from '../types';

/**
 * CoachListTable Component
 * Displays coaches with assignment statistics, activity info, and fee access toggle
 * 
 * Requirements: 15.2, 9.1, 9.4, 10.1, 10.2, 10.3
 * 
 * Shows:
 * - Coach name
 * - Role label
 * - Number of assigned batches
 * - Number of assigned students
 * - Last active timestamp
 * - Fee access toggle
 */

interface CoachListTableProps {
  coaches: User[];
  students: Student[];
  batches?: Batch[];
  selectedCoachId?: string;
  onCoachSelect?: (coach: User) => void;
  onEditCoach?: (coach: User) => void;
  onDeleteCoach?: (coach: User) => void;
  onFeeAccessToggle?: (coachId: string, value: boolean) => void;
}

export const CoachListTable: React.FC<CoachListTableProps> = ({ 
  coaches, 
  students, 
  batches = [],
  selectedCoachId,
  onCoachSelect,
  onEditCoach,
  onDeleteCoach,
  onFeeAccessToggle,
}) => {
  // Calculate assignment statistics for each coach
  const getCoachStats = React.useMemo(() => {
    return (coachId: string) => {
      // Count assigned students
      const assignedStudentCount = students.filter(
        (student) => student.assignedCoachId === coachId
      ).length;

      // Count assigned batches
      const assignedBatchCount = batches.filter(
        (batch) => batch.assignedCoachId === coachId
      ).length;

      return {
        studentCount: assignedStudentCount,
        batchCount: assignedBatchCount,
      };
    };
  }, [students, batches]);

  // Format date and time
  const formatLastActive = (date: Date | string): string => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return d.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Show all coaches (HEAD_COACH and ASSISTANT_COACH) — API now returns both
  const allCoaches = coaches.filter(
    (coach) => coach.role === 'ASSISTANT_COACH' || coach.role === 'HEAD_COACH'
  );

  // Format role label for display
  const formatRoleLabel = (role: string): string => {
    switch (role) {
      case 'HEAD_COACH':
        return 'Head Coach';
      case 'ASSISTANT_COACH':
        return 'Assistant Coach';
      default:
        return role;
    }
  };

  if (allCoaches.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h3 className="empty-state__title">No Coaches Found</h3>
        <p className="empty-state__text">No coaches to display. Start by adding your first coach.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-responsive-cards">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Coach Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Specialization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Assigned Batches
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Assigned Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Fee Access
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {allCoaches.map((coach) => {
              const stats = getCoachStats(coach.id);
              const isSelected = selectedCoachId === coach.id;
              return (
                <tr 
                  key={coach.id} 
                  onClick={() => onCoachSelect?.(coach)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                  } ${onCoachSelect ? 'cursor-pointer' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Coach">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {coach.profilePhoto ? (
                          <img
                            src={coach.profilePhoto}
                            alt={coach.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {coach.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {coach.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {coach.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Role">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        coach.role === 'HEAD_COACH'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}
                    >
                      {formatRoleLabel(coach.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" data-label="Specialization">
                    {coach.specialization || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100" data-label="Batches">
                    <span className="font-medium">{stats.batchCount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100" data-label="Students">
                    <span className="font-medium">{stats.studentCount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Fee Access" onClick={(e) => e.stopPropagation()}>
                    <FeeAccessToggle
                      coachId={coach.id}
                      coachRole={coach.role}
                      canAccessFees={coach.canAccessFees ?? false}
                      onToggle={onFeeAccessToggle ?? (() => {})}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" data-label="Last Active">
                    {formatLastActive(coach.lastActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2" data-label="">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditCoach?.(coach); }}
                      className="text-action text-action--primary"
                      title="Edit coach"
                    >
                      Edit
                    </button>
                    {coach.role === 'ASSISTANT_COACH' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteCoach?.(coach); }}
                        className="text-action text-action--danger"
                        title="Delete coach"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoachListTable;

import React from 'react';
import type { User, Student, Batch } from '../types';

/**
 * CoachListTable Component
 * Displays assistant coaches with assignment statistics and activity info
 * 
 * Requirements: 15.2
 * 
 * Shows:
 * - Coach name
 * - Number of assigned batches
 * - Number of assigned students
 * - Last active timestamp
 */

interface CoachListTableProps {
  coaches: User[];
  students: Student[];
  batches?: Batch[];
  selectedCoachId?: string;
  onCoachSelect?: (coach: User) => void;
  onEditCoach?: (coach: User) => void;
  onDeleteCoach?: (coach: User) => void;
}

export const CoachListTable: React.FC<CoachListTableProps> = ({ 
  coaches, 
  students, 
  batches = [],
  selectedCoachId,
  onCoachSelect,
  onEditCoach,
  onDeleteCoach,
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

  // Filter only assistant coaches
  const assistantCoaches = coaches.filter((coach) => coach.role === 'ASSISTANT_COACH');

  if (assistantCoaches.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No assistant coaches found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Coach Name
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
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {assistantCoaches.map((coach) => {
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
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {coach.specialization || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <span className="font-medium">{stats.batchCount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <span className="font-medium">{stats.studentCount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatLastActive(coach.lastActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => onEditCoach?.(coach)}
                      className="text-action text-action--primary"
                      title="Edit coach"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteCoach?.(coach)}
                      className="text-action text-action--danger"
                      title="Delete coach"
                    >
                      Delete
                    </button>
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

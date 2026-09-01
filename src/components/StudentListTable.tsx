import React from 'react';
import type { Student, User } from '../types';

/**
 * StudentListTable Component
 * Table listing of students, styled to match CoachListTable so the two
 * "Users" pages (Students / Coaches) share one consistent listing pattern.
 *
 * Shows:
 * - Student name, email/BAID
 * - Batch
 * - Skill level
 * - Assigned coach
 * - Status
 * - View action
 */

interface StudentListTableProps {
  students: Student[];
  coaches?: User[];
  onStudentClick?: (studentId: string) => void;
  getBatchName?: (batchId: string | undefined) => string;
}

const getSkillLevelBadgeClass = (skillLevel: string): string => {
  switch (skillLevel) {
    case 'Beginner':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Intermediate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Advanced':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'Professional':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export const StudentListTable: React.FC<StudentListTableProps> = ({
  students,
  coaches = [],
  onStudentClick,
  getBatchName,
}) => {
  const coachNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    coaches.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [coaches]);

  if (students.length === 0) {
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
        <h3 className="empty-state__title">No Students Found</h3>
        <p className="empty-state__text">No students to display. Start by enrolling your first student.</p>
      </div>
    );
  }

  const getInitials = (name: string): string =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="table-card-wrapper bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-responsive-cards">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Batch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Skill Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Assigned Coach
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {students.map((student) => (
              <tr
                key={student.id}
                onClick={() => onStudentClick?.(student.id)}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${onStudentClick ? 'cursor-pointer' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap" data-label="Student">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {student.profilePhoto ? (
                        <img
                          src={student.profilePhoto}
                          alt={student.fullName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {getInitials(student.fullName)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {student.fullName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" data-label="Batch">
                  {getBatchName ? getBatchName(student.batchId) : student.batchId || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap" data-label="Skill Level">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillLevelBadgeClass(student.skillLevel)}`}
                  >
                    {student.skillLevel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" data-label="Coach">
                  {student.assignedCoachId ? coachNameById.get(student.assignedCoachId) || 'Unknown' : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize" data-label="Status">
                  {student.status || 'active'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" data-label="">
                  <button
                    onClick={(e) => { e.stopPropagation(); onStudentClick?.(student.id); }}
                    className="text-action text-action--primary"
                    title="View student"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentListTable;

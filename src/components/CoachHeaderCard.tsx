import React from 'react';
import type { User, UserRole } from '../types';

/**
 * CoachHeaderCard Component
 * 
 * Displays coach profile information in a header card with:
 * - Coach profile photo or avatar fallback
 * - Coach name, email, and specialization
 * - Summary counts (batches, students)
 * - Responsive design for mobile and desktop
 * - Conditional field visibility based on user role
 * 
 * **Validates: Requirements 1.1, 1.5, 2.6**
 */

interface CoachHeaderCardProps {
  coach: User;
  batchCount?: number;
  studentCount?: number;
  userRole?: UserRole;
}

/**
 * Generate initials from coach name for avatar fallback
 */
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Get background color class for avatar based on name hash
 */
const getAvatarColorClass = (name: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-rose-500',
  ];
  const hash = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return colors[hash % colors.length];
};

export const CoachHeaderCard: React.FC<CoachHeaderCardProps> = ({
  coach,
  batchCount = 0,
  studentCount = 0,
  userRole = 'STUDENT',
}) => {
  const initials = getInitials(coach.name);
  const avatarColorClass = getAvatarColorClass(coach.name);

  // Determine if sensitive fields should be visible
  // Email and phone are only visible to HEAD_COACH and admin users
  const isSensitiveFieldsVisible = userRole === 'HEAD_COACH';

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
      {/* Main content: flex container for responsive layout */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Avatar Section */}
        <div className="flex-shrink-0">
          <div
            className={`${avatarColorClass} w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-sm flex-shrink-0`}
          >
            {coach.profilePhoto ? (
              <img
                src={coach.profilePhoto}
                alt={coach.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 m-0">
            {coach.name}
          </h1>

          {/* Email and Specialization */}
          <div className="flex flex-col gap-1 text-sm sm:text-base">
            {isSensitiveFieldsVisible && coach.email && (
              <div className="text-slate-600 dark:text-slate-400">
                {coach.email}
              </div>
            )}
            {coach.specialization && (
              <div className="text-slate-600 dark:text-slate-400">
                Specialization: {coach.specialization}
              </div>
            )}
          </div>
        </div>

        {/* Counts Section - responsive grid */}
        <div className="flex gap-4 sm:gap-6 mt-4 sm:mt-0 sm:flex-col sm:justify-center">
          {/* Batch Count */}
          <div className="flex flex-col items-center sm:items-end gap-1">
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {batchCount}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
              {batchCount === 1 ? 'Batch' : 'Batches'}
            </div>
          </div>

          {/* Student Count */}
          <div className="flex flex-col items-center sm:items-end gap-1">
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {studentCount}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
              {studentCount === 1 ? 'Student' : 'Students'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachHeaderCard;

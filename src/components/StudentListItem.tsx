import React from 'react';
import type { Student } from '../types';

/**
 * StudentListItem Component
 * Renders individual student row with all fields
 *
 * Requirements:
 * 8.1: Display individual student row with name, batch, skill level, performance status
 * 8.2: Support click to open quick view modal
 * 9.3: Show remove button for HEAD_COACH only
 */

interface StudentListItemProps {
  student: Student;
  performanceStatus: string;
  onSelect?: (student: Student) => void;
  onRemove?: (student: Student) => void;
  canRemove?: boolean;
  isRemoving?: boolean;
}

export const StudentListItem: React.FC<StudentListItemProps> = ({
  student,
  performanceStatus,
  onSelect,
  onRemove,
  canRemove = false,
  isRemoving = false,
}) => {
  const handleItemClick = () => {
    onSelect?.(student);
  };

  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleItemClick();
    }
  };

  const handleRemoveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onRemove && !isRemoving) {
      // Pass the student object instead of just the ID
      onRemove(student);
    }
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleItemClick}
      onKeyDown={handleItemKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for student: ${student.fullName}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {student.profilePhoto ? (
              <img
                src={student.profilePhoto}
                alt={student.fullName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {student.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Student Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-gray-900 truncate">
              {student.fullName}
            </h4>

            {/* Student Details Grid */}
            <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4 text-sm">
              <div>
                <span className="text-gray-600">Batch:</span>
                <p className="text-gray-900 font-medium">{student.batchId || '—'}</p>
              </div>
              <div>
                <span className="text-gray-600">Skill Level:</span>
                <p className="text-gray-900 font-medium">{student.skillLevel}</p>
              </div>
              <div>
                <span className="text-gray-600">Performance:</span>
                <p className="text-gray-900 font-medium">{performanceStatus}</p>
              </div>
              <div>
                <span className="text-gray-600">Age:</span>
                <p className="text-gray-900 font-medium">{student.age} yrs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (HEAD_COACH only) */}
        {canRemove && (
          <div className="flex-shrink-0 flex gap-2">
            <button
              onClick={handleRemoveClick}
              disabled={isRemoving}
              className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Remove student: ${student.fullName}`}
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentListItem;

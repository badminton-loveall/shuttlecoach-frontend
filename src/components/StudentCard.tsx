import React from 'react';
import type { Student } from '../types';
import './StudentCard.css';

/**
 * StudentCard Component
 * Displays a compact student card with avatar, name, batch, skill level, and progress bar
 * Shows "due for review" badge when student needs bi-monthly assessment
 * Uses pure CSS with design tokens and BEM methodology
 */

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
  isDueForReview?: boolean;
  daysOverdue?: number;
}

const getSkillLevelVariant = (skillLevel: string): string => {
  switch (skillLevel) {
    case 'Beginner':
      return 'info';
    case 'Intermediate':
      return 'warning';
    case 'Advanced':
      return 'primary';
    case 'Professional':
      return 'success';
    default:
      return 'info';
  }
};

const getSkillLevelProgress = (skillLevel: string): number => {
  switch (skillLevel) {
    case 'Beginner':
      return 25;
    case 'Intermediate':
      return 50;
    case 'Advanced':
      return 75;
    case 'Professional':
      return 100;
    default:
      return 0;
  }
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const StudentCard: React.FC<StudentCardProps> = ({ 
  student, 
  onClick, 
  isDueForReview = false,
  daysOverdue = 0
}) => {
  const skillVariant = getSkillLevelVariant(student.skillLevel);
  const progressValue = getSkillLevelProgress(student.skillLevel);
  const initials = getInitials(student.fullName);

  const formatOverdueMessage = () => {
    if (daysOverdue >= 9999) {
      return 'Never assessed';
    }
    return `${daysOverdue} days overdue`;
  };

  return (
    <div className="student-card" onClick={onClick} role="button" tabIndex={0}>
      {/* Avatar */}
      <div className={`student-card__avatar student-card__avatar--${skillVariant}`}>
        {student.profilePhoto ? (
          <img src={student.profilePhoto} alt={student.fullName} className="student-card__avatar-img" />
        ) : (
          <span className="student-card__avatar-initials">{initials}</span>
        )}
      </div>

      {/* Card Content */}
      <div className="student-card__content">
        {/* Name */}
        <h3 className="student-card__name">{student.fullName}</h3>

        {/* Batch Info */}
        {student.batchId && <p className="student-card__batch">Batch {student.batchId.split('-')[1]}</p>}

        {/* Skill Level Badge */}
        <div className={`student-card__skill-badge student-card__skill-badge--${skillVariant}`}>
          {student.skillLevel}
        </div>

        {/* Progress Bar */}
        <div className="student-card__progress">
          <div className="student-card__progress-bar">
            <div
              className={`student-card__progress-fill student-card__progress-fill--${skillVariant}`}
              style={{ width: `${progressValue}%` }}
            ></div>
          </div>
          <span className="student-card__progress-label">{progressValue}%</span>
        </div>

        {/* Due for Review Badge */}
        {isDueForReview && (
          <div className="student-card__due-badge" title={`Assessment overdue: ${formatOverdueMessage()}`}>
            <span className="student-card__due-icon">⚠️</span>
            <span className="student-card__due-text">{formatOverdueMessage()}</span>
          </div>
        )}
      </div>

      {/* BAID Indicator */}
      {student.baidNumber && (
        <div className="student-card__baid-indicator" title="BAID Registered">
          ✓
        </div>
      )}
    </div>
  );
};

export default StudentCard;

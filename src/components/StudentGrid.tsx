import React from 'react';
import type { Student } from '../types';
import StudentCard from './StudentCard';
import './StudentGrid.css';

/**
 * StudentGrid Component
 * Displays students in a responsive grid layout with 4 columns on desktop,
 * 2 on tablet, and 1 on mobile
 */

interface StudentGridProps {
  students: Student[];
  onStudentClick?: (studentId: string) => void;
  studentReviewStatus?: Map<string, { isDue: boolean; daysOverdue: number }>;
}

export const StudentGrid: React.FC<StudentGridProps> = ({ 
  students, 
  onStudentClick,
  studentReviewStatus = new Map()
}) => {
  if (!students || students.length === 0) {
    return (
      <div className="student-grid__empty">
        <div>
          <div className="student-grid__empty-icon">👥</div>
          <h3 className="student-grid__empty-title">No Students Found</h3>
          <p className="student-grid__empty-text">No students to display. Start by adding your first student.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-grid">
      {students.map((student) => {
        const reviewStatus = studentReviewStatus.get(student.id);
        return (
          <div key={student.id} className="student-grid__item">
            <StudentCard
              student={student}
              onClick={() => onStudentClick?.(student.id)}
              isDueForReview={reviewStatus?.isDue ?? false}
              daysOverdue={reviewStatus?.daysOverdue ?? 0}
            />
          </div>
        );
      })}
    </div>
  );
};

export default StudentGrid;

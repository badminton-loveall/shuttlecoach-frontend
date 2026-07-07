/**
 * FeeAlerts Component
 * Displays overdue fee alerts with student list
 */

import React from 'react';
import type { Student, FeeRecord } from '../types';
import './FeeAlerts.css';

interface FeeAlertsProps {
  overdueFees: Array<{
    student: Student;
    overdueFees: FeeRecord[];
    totalOverdue: number;
  }>;
  onViewDetails?: () => void;
}

export const FeeAlerts: React.FC<FeeAlertsProps> = ({ overdueFees, onViewDetails }) => {
  const totalOverdueCount = overdueFees.reduce(
    (sum, item) => sum + item.overdueFees.length,
    0
  );

  if (overdueFees.length === 0) {
    return (
      <div className="fee-alerts fee-alerts--success">
        <div className="fee-alerts__container">
          <div className="fee-alerts__icon-wrapper fee-alerts__icon-wrapper--success">
            <svg className="fee-alerts__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="fee-alerts__content">
            <h3 className="fee-alerts__title fee-alerts__title--success">Fee Alerts</h3>
            <p className="fee-alerts__subtitle fee-alerts__subtitle--success">All fees up to date</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fee-alerts fee-alerts--danger">
      <div className="fee-alerts__container">
        <div className="fee-alerts__icon-wrapper fee-alerts__icon-wrapper--danger">
          <svg className="fee-alerts__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="fee-alerts__content">
          <div className="fee-alerts__header">
            <h3 className="fee-alerts__title fee-alerts__title--danger">Fee Alerts</h3>
            <span className="fee-alerts__count">{totalOverdueCount} overdue</span>
          </div>
          <p className="fee-alerts__subtitle fee-alerts__subtitle--danger">
            {overdueFees.length} student{overdueFees.length !== 1 ? 's' : ''} with overdue fees
          </p>

          {/* Student list - compact */}
          <div className="fee-alerts__list">
            {overdueFees.slice(0, 3).map(({ student, totalOverdue }) => (
              <div key={student.id} className="fee-alerts__list-item">
                <p className="fee-alerts__student-name">{student.fullName}</p>
                <p className="fee-alerts__amount">₹{totalOverdue.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {overdueFees.length > 3 && (
            <p className="fee-alerts__more-text">+{overdueFees.length - 3} more</p>
          )}

          {onViewDetails && (
            <button onClick={onViewDetails} className="fee-alerts__view-btn">
              View all →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeAlerts;

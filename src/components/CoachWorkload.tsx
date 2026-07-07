/**
 * CoachWorkload Component
 * Displays coach workload statistics with visual indicators
 */

import React from 'react';
import type { CoachWorkload as CoachWorkloadType } from '../utils/activityUtils';
import './CoachWorkload.css';

interface CoachWorkloadProps {
  workloads: CoachWorkloadType[];
}

export const CoachWorkload: React.FC<CoachWorkloadProps> = ({ workloads }) => {
  if (workloads.length === 0) {
    return (
      <div className="coach-workload">
        <h3 className="coach-workload__title">Coach Workloads</h3>
        <p className="coach-workload__subtitle">No coach assignments</p>
      </div>
    );
  }

  return (
    <div className="coach-workload">
      <h3 className="coach-workload__title">Coach Workloads</h3>
      <p className="coach-workload__subtitle">Student assignments per coach</p>

      <div className="coach-workload__list">
        {workloads.map((workload) => {
          const getStatusVariant = () => {
            if (workload.isOverloaded) return 'red';
            if (workload.isBalanced) return 'green';
            if (workload.isUnderloaded) return 'yellow';
            return 'gray';
          };

          const getStatusLabel = () => {
            if (workload.isOverloaded) return 'Overloaded';
            if (workload.isBalanced) return 'Balanced';
            if (workload.isUnderloaded) return 'Light';
            if (workload.studentCount === 0) return 'No assignments';
            return '';
          };

          const variant = getStatusVariant();
          const statusLabel = getStatusLabel();

          return (
            <div key={workload.coachId} className="coach-workload__item">
              <div className="coach-workload__item-content">
                <div className={`coach-workload__badge coach-workload__badge--${variant}`}>
                  {workload.studentCount}
                </div>
                <p className="coach-workload__name">{workload.coachName}</p>
              </div>
              {statusLabel && (
                <span className={`coach-workload__status-label coach-workload__status-label--${variant}`}>
                  {statusLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="coach-workload__legend">
        <div className="coach-workload__legend-item">
          <span className="coach-workload__legend-dot coach-workload__legend-dot--green"></span>
          <span>Balanced</span>
        </div>
        <div className="coach-workload__legend-item">
          <span className="coach-workload__legend-dot coach-workload__legend-dot--yellow"></span>
          <span>Light</span>
        </div>
        <div className="coach-workload__legend-item">
          <span className="coach-workload__legend-dot coach-workload__legend-dot--red"></span>
          <span>Overload</span>
        </div>
      </div>
    </div>
  );
};

export default CoachWorkload;

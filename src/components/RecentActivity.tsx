/**
 * RecentActivity Component
 * Displays recent activity feed with latest assessments, training logs, and student additions
 */

import React from 'react';
import type { Activity } from '../utils/activityUtils';
import './RecentActivity.css';

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'assessment':
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        );
      case 'training_log':
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        );
      case 'student_added':
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        );
    }
  };

  const getActivityVariant = (type: Activity['type']): 'blue' | 'green' | 'purple' => {
    switch (type) {
      case 'assessment':
        return 'blue';
      case 'training_log':
        return 'green';
      case 'student_added':
        return 'purple';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 7) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="recent-activity">
        <h3 className="recent-activity__title">Recent Activity</h3>
        <p className="recent-activity__subtitle">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <h3 className="recent-activity__title">Recent Activity</h3>
      <p className="recent-activity__subtitle">Latest updates</p>

      <div className="recent-activity__list">
        {activities.slice(0, 4).map((activity) => {
          const variant = getActivityVariant(activity.type);

          return (
            <div key={activity.id} className="recent-activity__item">
              <div className={`recent-activity__icon-wrapper recent-activity__icon-wrapper--${variant}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="recent-activity__content">
                <p className="recent-activity__item-title">{activity.title}</p>
                <p className="recent-activity__description">{activity.description}</p>
              </div>
              <p className="recent-activity__timestamp">{formatTimestamp(activity.timestamp)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;

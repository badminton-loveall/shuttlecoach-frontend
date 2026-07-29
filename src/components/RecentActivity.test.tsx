/**
 * Tests for RecentActivity component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecentActivity from './RecentActivity';
import type { Activity } from '../utils/activityUtils';

describe('RecentActivity', () => {
  const mockActivities: Activity[] = [
    {
      id: 'activity-1',
      type: 'assessment',
      title: 'Skill Assessment Recorded',
      description: 'Coach John completed skill assessment for Alice Smith (Jan-Feb 2026)',
      timestamp: new Date('2026-01-15T10:00:00Z'),
      coachName: 'Coach John',
      studentName: 'Alice Smith',
    },
    {
      id: 'activity-2',
      type: 'training_log',
      title: 'Training Log Added',
      description: 'Coach Sarah added Week 1 training notes for Bob Johnson',
      timestamp: new Date('2026-01-14T15:30:00Z'),
      coachName: 'Coach Sarah',
      studentName: 'Bob Johnson',
    },
    {
      id: 'activity-3',
      type: 'student_added',
      title: 'New Student Added',
      description: 'Carol White joined Batch 2',
      timestamp: new Date('2026-01-13T09:00:00Z'),
      coachName: 'System',
      studentName: 'Carol White',
    },
  ];

  it('should render empty state when no activities', () => {
    render(<RecentActivity activities={[]} />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
  });

  it('should render activity titles', () => {
    render(<RecentActivity activities={mockActivities} />);
    expect(screen.getByText('Skill Assessment Recorded')).toBeInTheDocument();
    expect(screen.getByText('Training Log Added')).toBeInTheDocument();
    expect(screen.getByText('New Student Added')).toBeInTheDocument();
  });

  it('should render activity descriptions', () => {
    render(<RecentActivity activities={mockActivities} />);
    expect(
      screen.getByText(/coach john completed skill assessment for alice smith/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/coach sarah added week 1 training notes for bob johnson/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/carol white joined batch 2/i)).toBeInTheDocument();
  });

  it('should render all activity types', () => {
    render(<RecentActivity activities={mockActivities} />);
    // Check that all activities are rendered by checking titles which are unique
    expect(screen.getByText('Skill Assessment Recorded')).toBeInTheDocument();
    expect(screen.getByText('Training Log Added')).toBeInTheDocument();
    expect(screen.getByText('New Student Added')).toBeInTheDocument();
  });

  it('should format recent timestamps correctly', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentActivity: Activity = {
      id: 'activity-recent',
      type: 'assessment',
      title: 'Recent Assessment',
      description: 'Test description',
      timestamp: oneHourAgo,
      coachName: 'Test Coach',
    };
    render(<RecentActivity activities={[recentActivity]} />);
    expect(screen.getByText(/1h ago|Just now/i)).toBeInTheDocument();
  });

  it('should format old timestamps as dates', () => {
    const oldDate = new Date('2025-06-15');
    const oldActivity: Activity = {
      id: 'activity-old',
      type: 'student_added',
      title: 'Old Activity',
      description: 'Test description',
      timestamp: oldDate,
      coachName: 'Test Coach',
    };
    render(<RecentActivity activities={[oldActivity]} />);
    expect(screen.getByText(/jun 15/i)).toBeInTheDocument();
  });

  it('should render correct number of activities', () => {
    const { container } = render(<RecentActivity activities={mockActivities} />);
    const activityItems = container.querySelectorAll('.recent-activity__item');
    expect(activityItems.length).toBe(mockActivities.length);
  });
});

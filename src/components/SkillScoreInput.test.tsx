/**
 * SkillScoreInput Component Tests
 *
 * Tests for the weekly score-recording form, which scores whatever drills
 * were actually assigned that week (grouped by the drill's own category) —
 * never a fixed skill catalog.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SkillScoreInput } from './SkillScoreInput';
import type { Drill } from '../types';

const drillA: Drill = { id: 'drill-1', name: 'Clear to Drop Combination', description: '', category: 'Combination Drills' };
const drillB: Drill = { id: 'drill-2', name: 'Grip Practice', description: '', category: 'Fundamentals' };

const defaultProps = {
  studentId: 'student-1',
  cycleKey: 'Jan-Feb 2026',
  weekNumber: 3 as const,
  assignedDrillsByCategory: { 'Combination Drills': [drillA], Fundamentals: [drillB] },
  curriculumLoading: false,
  onSave: vi.fn().mockResolvedValue(undefined),
  onCancel: vi.fn(),
};

describe('SkillScoreInput', () => {
  it('shows which week is being recorded', () => {
    render(<SkillScoreInput {...defaultProps} weekNumber={5} />);
    expect(screen.getByText('Recording scores for Week 5')).toBeInTheDocument();
  });

  it('renders a tab per category present in the assigned drills', () => {
    render(<SkillScoreInput {...defaultProps} />);
    expect(screen.getByRole('tab', { name: 'Combination Drills' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Fundamentals' })).toBeInTheDocument();
  });

  it('only shows drills actually assigned that week, not a fixed catalog', () => {
    render(<SkillScoreInput {...defaultProps} />);
    expect(screen.getByText('Clear to Drop Combination')).toBeInTheDocument();
    expect(screen.queryByText('Grip Practice')).not.toBeInTheDocument(); // different tab, not active
  });

  it('switches tabs to reveal the other category drills', () => {
    render(<SkillScoreInput {...defaultProps} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Fundamentals' }));
    expect(screen.getByText('Grip Practice')).toBeInTheDocument();
    expect(screen.queryByText('Clear to Drop Combination')).not.toBeInTheDocument();
  });

  it('shows a clear message when nothing is assigned for the week', () => {
    render(<SkillScoreInput {...defaultProps} assignedDrillsByCategory={{}} />);
    expect(screen.getByText(/No drills are assigned for Week 3 yet/)).toBeInTheDocument();
  });

  it('disables Save when there is nothing assigned', () => {
    render(<SkillScoreInput {...defaultProps} assignedDrillsByCategory={{}} />);
    expect(screen.getByTestId('save-scores-button')).toBeDisabled();
  });

  it('shows a validation error when saving with nothing scored', async () => {
    render(<SkillScoreInput {...defaultProps} />);
    fireEvent.click(screen.getByTestId('save-scores-button'));
    expect(await screen.findByText('Please score at least one skill before saving.')).toBeInTheDocument();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with the drill id/name/category for touched skills', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<SkillScoreInput {...defaultProps} onSave={onSave} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Score 3: Adv' }));
    fireEvent.click(screen.getByTestId('save-scores-button'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        studentId: 'student-1',
        cycleKey: 'Jan-Feb 2026',
        weekNumber: 3,
        scores: [{ skillId: 'drill-1', skillName: 'Clear to Drop Combination', category: 'Combination Drills', score: 3 }],
      });
    });
  });

  it('shows an error message on save failure', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<SkillScoreInput {...defaultProps} onSave={onSave} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Score 2: Int' }));
    fireEvent.click(screen.getByTestId('save-scores-button'));

    await waitFor(() => {
      expect(screen.getByText('Failed to save scores. Please try again.')).toBeInTheDocument();
    });
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<SkillScoreInput {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('cancel-recording-button'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows a loading message while the curriculum is still loading', () => {
    render(<SkillScoreInput {...defaultProps} curriculumLoading={true} />);
    expect(screen.getByText('Loading assigned drills…')).toBeInTheDocument();
  });
});

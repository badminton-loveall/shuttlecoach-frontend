/**
 * SkillScoreInput Component Tests
 *
 * Tests for the score recording form component.
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SkillScoreInput } from './SkillScoreInput';
import { SKILL_CATALOG } from '../constants/skillCatalog';
import type { SkillScore } from '../constants/skillCatalog';

const defaultProps = {
  studentId: 'student-1',
  cycleKey: 'Jan-Feb 2026',
  weekNumber: 3 as const,
  onSave: vi.fn().mockResolvedValue(undefined),
  onCancel: vi.fn(),
};

describe('SkillScoreInput', () => {
  it('renders all 5 category sections', () => {
    render(<SkillScoreInput {...defaultProps} />);

    expect(screen.getByTestId('category-section-service')).toBeInTheDocument();
    expect(screen.getByTestId('category-section-serviceReturn')).toBeInTheDocument();
    expect(screen.getByTestId('category-section-forehand')).toBeInTheDocument();
    expect(screen.getByTestId('category-section-roundHead')).toBeInTheDocument();
    expect(screen.getByTestId('category-section-backhand')).toBeInTheDocument();
  });

  it('displays header with current week number', () => {
    render(<SkillScoreInput {...defaultProps} weekNumber={5} />);

    expect(screen.getByText('Record Scores - Week 5')).toBeInTheDocument();
  });

  it('renders week selector with 8 buttons and correct active state', () => {
    render(<SkillScoreInput {...defaultProps} weekNumber={3} />);

    const weekBtn3 = screen.getByTestId('week-button-3');
    expect(weekBtn3).toHaveAttribute('aria-pressed', 'true');

    const weekBtn1 = screen.getByTestId('week-button-1');
    expect(weekBtn1).toHaveAttribute('aria-pressed', 'false');
  });

  it('allows selecting a score for a skill', () => {
    render(<SkillScoreInput {...defaultProps} />);

    const scoreBtn = screen.getByTestId('score-btn-bh-short-service-3');
    fireEvent.click(scoreBtn);

    expect(scoreBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles score off when clicking the same score button again', () => {
    render(<SkillScoreInput {...defaultProps} />);

    const scoreBtn = screen.getByTestId('score-btn-bh-short-service-2');
    fireEvent.click(scoreBtn);
    expect(scoreBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(scoreBtn);
    expect(scoreBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('collapses and expands a category section', () => {
    render(<SkillScoreInput {...defaultProps} />);

    const header = screen.getByTestId('category-header-service');
    // Initially expanded - skills should be visible
    expect(screen.getByTestId('skill-row-bh-short-service')).toBeInTheDocument();

    // Collapse
    fireEvent.click(header);
    expect(screen.queryByTestId('skill-row-bh-short-service')).not.toBeInTheDocument();

    // Expand again
    fireEvent.click(header);
    expect(screen.getByTestId('skill-row-bh-short-service')).toBeInTheDocument();
  });

  it('shows "Copy from last week" button when previousScores are provided', () => {
    const previousScores: Record<string, SkillScore> = {
      'bh-short-service': 2,
      'bh-flick-service': 3,
    };

    render(<SkillScoreInput {...defaultProps} previousScores={previousScores} />);

    expect(screen.getByTestId('copy-last-week-button')).toBeInTheDocument();
  });

  it('does not show "Copy from last week" when no previousScores provided', () => {
    render(<SkillScoreInput {...defaultProps} />);

    expect(screen.queryByTestId('copy-last-week-button')).not.toBeInTheDocument();
  });

  it('copies previous scores when "Copy from last week" is clicked', () => {
    const previousScores: Record<string, SkillScore> = {
      'bh-short-service': 2,
      'bh-flick-service': 3,
    };

    render(<SkillScoreInput {...defaultProps} previousScores={previousScores} />);

    fireEvent.click(screen.getByTestId('copy-last-week-button'));

    // The score buttons for previously scored skills should now be active
    expect(screen.getByTestId('score-btn-bh-short-service-2')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('score-btn-bh-flick-service-3')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onSave with only scored skills (partial submission)', async () => {
    const mockOnSave = vi.fn().mockResolvedValue(undefined);
    render(<SkillScoreInput {...defaultProps} onSave={mockOnSave} />);

    // Score only one skill
    fireEvent.click(screen.getByTestId('score-btn-bh-short-service-4'));

    // Save
    fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith([
        {
          skillId: 'bh-short-service',
          skillName: 'BH Short Service',
          category: 'service',
          score: 4,
        },
      ]);
    });
  });

  it('calls onSave with empty array when no skills are scored', async () => {
    const mockOnSave = vi.fn().mockResolvedValue(undefined);
    render(<SkillScoreInput {...defaultProps} onSave={mockOnSave} />);

    fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith([]);
    });
  });

  it('shows error message on save failure and preserves scores', async () => {
    const mockOnSave = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<SkillScoreInput {...defaultProps} onSave={mockOnSave} />);

    // Score a skill
    fireEvent.click(screen.getByTestId('score-btn-bh-short-service-3'));

    // Try to save
    fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('score-input-error')).toHaveTextContent('Network error');
    });

    // Score should still be preserved
    expect(screen.getByTestId('score-btn-bh-short-service-3')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onCancel when cancel button is clicked', () => {
    const mockOnCancel = vi.fn();
    render(<SkillScoreInput {...defaultProps} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByTestId('cancel-button'));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('changes week when a week button is clicked', () => {
    render(<SkillScoreInput {...defaultProps} weekNumber={1} />);

    fireEvent.click(screen.getByTestId('week-button-5'));

    expect(screen.getByText('Record Scores - Week 5')).toBeInTheDocument();
    expect(screen.getByTestId('week-button-5')).toHaveAttribute('aria-pressed', 'true');
  });

  it('displays all skills from the service category', () => {
    render(<SkillScoreInput {...defaultProps} />);

    const serviceSkills = SKILL_CATALOG.service.skills;
    serviceSkills.forEach((skill) => {
      expect(screen.getByTestId(`skill-row-${skill.id}`)).toBeInTheDocument();
    });
  });

  it('displays 5 score buttons per skill (0 through 4)', () => {
    render(<SkillScoreInput {...defaultProps} />);

    const skillId = 'bh-short-service';
    for (let i = 0; i <= 4; i++) {
      expect(screen.getByTestId(`score-btn-${skillId}-${i}`)).toBeInTheDocument();
    }
  });

  it('shows saving state on the save button during submission', async () => {
    // Create a promise that we control
    let resolvePromise: () => void;
    const pendingPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    const mockOnSave = vi.fn().mockReturnValue(pendingPromise);

    render(<SkillScoreInput {...defaultProps} onSave={mockOnSave} />);

    fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('save-button')).toHaveTextContent('Saving...');
      expect(screen.getByTestId('save-button')).toBeDisabled();
    });

    // Resolve to cleanup
    resolvePromise!();
    await waitFor(() => {
      expect(screen.getByTestId('save-button')).toHaveTextContent('Save Scores');
    });
  });
});

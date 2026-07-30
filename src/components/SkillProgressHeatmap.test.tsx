/**
 * SkillProgressHeatmap Component Tests
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SkillProgressHeatmap } from './SkillProgressHeatmap';
import type { SkillScoreMatrix, SkillScore } from '../constants/skillCatalog';

// ─── Test Fixtures ───────────────────────────────────────────────────────────

function createTestMatrix(overrides?: Partial<SkillScoreMatrix>): SkillScoreMatrix {
  return {
    studentId: 'student-1',
    cycleKey: 'Jan-Feb 2026',
    weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    categories: [
      {
        categoryId: 'service',
        categoryLabel: 'Service',
        skills: [
          {
            skillId: 'bh-short-service',
            skillName: 'BH Short Service',
            scores: [0, 1, 2, 3, 4, null, null, null],
            latestScore: 4,
          },
          {
            skillId: 'fh-long-service',
            skillName: 'FH Long Service',
            scores: [null, null, null, null, null, null, null, null],
            latestScore: null,
          },
        ],
      },
      {
        categoryId: 'forehand',
        categoryLabel: 'Forehand (FH)',
        skills: [
          {
            skillId: 'cross-drop-fh',
            skillName: 'Cross Drop FH',
            scores: [2, 2, 3, 3, 3, 4, null, null],
            latestScore: 4,
          },
        ],
      },
    ],
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SkillProgressHeatmap', () => {
  const mockOnSkillClick = vi.fn();

  beforeEach(() => {
    mockOnSkillClick.mockClear();
  });

  it('renders 8 week columns in header', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    for (let i = 1; i <= 8; i++) {
      expect(screen.getByText(`Wk${i}`)).toBeInTheDocument();
    }
  });

  it('renders all category groups with skill counts', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.getByText('Forehand (FH)')).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  it('renders skill names within categories', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    expect(screen.getByText('BH Short Service')).toBeInTheDocument();
    expect(screen.getByText('FH Long Service')).toBeInTheDocument();
    expect(screen.getByText('Cross Drop FH')).toBeInTheDocument();
  });

  it('renders "-" for null score cells', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    // FH Long Service has all null scores - should render "-" for each
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('renders numeric score values in cells', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    // BH Short Service has scores 0, 1, 2, 3 (4 shows checkmark)
    expect(screen.getByTestId('score-cell-bh-short-service-wk1')).toHaveTextContent('0');
    expect(screen.getByTestId('score-cell-bh-short-service-wk2')).toHaveTextContent('1');
    expect(screen.getByTestId('score-cell-bh-short-service-wk3')).toHaveTextContent('2');
    expect(screen.getByTestId('score-cell-bh-short-service-wk4')).toHaveTextContent('3');
  });

  it('renders checkmark icon for score 4 (Pro)', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    // Score 4 cells should have a checkmark SVG rather than the number
    const proCell = screen.getByTestId('score-cell-bh-short-service-wk5');
    expect(proCell.querySelector('svg')).toBeInTheDocument();
    expect(proCell).not.toHaveTextContent('4');
  });

  it('applies correct background color based on score', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    const cell0 = screen.getByTestId('score-cell-bh-short-service-wk1');
    expect(cell0).toHaveStyle({ backgroundColor: '#FEE2E2' });

    const cell1 = screen.getByTestId('score-cell-bh-short-service-wk2');
    expect(cell1).toHaveStyle({ backgroundColor: '#FED7AA' });

    const cell2 = screen.getByTestId('score-cell-bh-short-service-wk3');
    expect(cell2).toHaveStyle({ backgroundColor: '#FEF08A' });

    const cell3 = screen.getByTestId('score-cell-bh-short-service-wk4');
    expect(cell3).toHaveStyle({ backgroundColor: '#BBF7D0' });

    const cell4 = screen.getByTestId('score-cell-bh-short-service-wk5');
    expect(cell4).toHaveStyle({ backgroundColor: '#16A34A' });
  });

  it('shows tooltip on hover with week number, cycle, and score label', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    const cell = screen.getByTestId('score-cell-bh-short-service-wk3');
    fireEvent.mouseEnter(cell);

    const tooltip = screen.getByTestId('tooltip-bh-short-service-wk3');
    expect(tooltip).toHaveTextContent('Week 3, Jan-Feb 2026: 2 - Intermediate');
  });

  it('hides tooltip on mouse leave', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    const cell = screen.getByTestId('score-cell-bh-short-service-wk3');
    fireEvent.mouseEnter(cell);
    expect(screen.getByTestId('tooltip-bh-short-service-wk3')).toBeInTheDocument();

    fireEvent.mouseLeave(cell);
    expect(screen.queryByTestId('tooltip-bh-short-service-wk3')).not.toBeInTheDocument();
  });

  it('calls onSkillClick when skill name is clicked', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    fireEvent.click(screen.getByText('BH Short Service'));
    expect(mockOnSkillClick).toHaveBeenCalledWith('bh-short-service', 'BH Short Service');
  });

  it('calls onSkillClick when a score cell is clicked', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    const cell = screen.getByTestId('score-cell-bh-short-service-wk1');
    fireEvent.click(cell);
    expect(mockOnSkillClick).toHaveBeenCalledWith('bh-short-service', 'BH Short Service');
  });

  it('collapses category on header click and hides skills', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    // Service skills visible initially
    expect(screen.getByText('BH Short Service')).toBeInTheDocument();

    // Click category header to collapse
    fireEvent.click(screen.getByTestId('category-header-service'));

    // Skills should be hidden
    expect(screen.queryByText('BH Short Service')).not.toBeInTheDocument();
    expect(screen.queryByText('FH Long Service')).not.toBeInTheDocument();
  });

  it('expands category on second header click', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    // Collapse
    fireEvent.click(screen.getByTestId('category-header-service'));
    expect(screen.queryByText('BH Short Service')).not.toBeInTheDocument();

    // Expand
    fireEvent.click(screen.getByTestId('category-header-service'));
    expect(screen.getByText('BH Short Service')).toBeInTheDocument();
  });

  it('all categories are expanded initially', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    // All skill names should be visible
    expect(screen.getByText('BH Short Service')).toBeInTheDocument();
    expect(screen.getByText('FH Long Service')).toBeInTheDocument();
    expect(screen.getByText('Cross Drop FH')).toBeInTheDocument();
  });

  it('has overflow-x-auto class for horizontal scroll on mobile', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    const container = screen.getByTestId('skill-progress-heatmap');
    expect(container.className).toContain('overflow-x-auto');
  });

  it('supports keyboard navigation on skill name', () => {
    const matrix = createTestMatrix();
    render(<SkillProgressHeatmap matrix={matrix} onSkillClick={mockOnSkillClick} />);

    const skillNameCell = screen.getByText('BH Short Service');
    fireEvent.keyDown(skillNameCell, { key: 'Enter' });
    expect(mockOnSkillClick).toHaveBeenCalledWith('bh-short-service', 'BH Short Service');
  });
});

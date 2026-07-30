/**
 * CycleFilter Component Tests
 * Requirements: 6.2, 10.2
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CycleFilter } from './CycleFilter';

describe('CycleFilter', () => {
  const defaultProps = {
    selectedCycle: 'Jan-Feb 2026',
    availableCycles: ['Jan-Feb 2026', 'Mar-Apr 2026', 'May-Jun 2026'],
    onChange: vi.fn(),
  };

  it('renders the Cycle label', () => {
    render(<CycleFilter {...defaultProps} />);
    expect(screen.getByText('Cycle:')).toBeInTheDocument();
  });

  it('renders a select dropdown with available cycles as options', () => {
    render(<CycleFilter {...defaultProps} />);
    const select = screen.getByLabelText('Select training cycle');
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Jan-Feb 2026');
    expect(options[1]).toHaveTextContent('Mar-Apr 2026');
    expect(options[2]).toHaveTextContent('May-Jun 2026');
  });

  it('displays the selected cycle as the current value', () => {
    render(<CycleFilter {...defaultProps} />);
    const select = screen.getByLabelText('Select training cycle') as HTMLSelectElement;
    expect(select.value).toBe('Jan-Feb 2026');
  });

  it('calls onChange with the new cycle key when selection changes', () => {
    const onChange = vi.fn();
    render(<CycleFilter {...defaultProps} onChange={onChange} />);
    const select = screen.getByLabelText('Select training cycle');

    fireEvent.change(select, { target: { value: 'Mar-Apr 2026' } });
    expect(onChange).toHaveBeenCalledWith('Mar-Apr 2026');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('renders with a single cycle option', () => {
    render(
      <CycleFilter
        selectedCycle="Jan-Feb 2026"
        availableCycles={['Jan-Feb 2026']}
        onChange={vi.fn()}
      />
    );
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
  });

  it('renders with empty available cycles', () => {
    render(
      <CycleFilter
        selectedCycle=""
        availableCycles={[]}
        onChange={vi.fn()}
      />
    );
    const options = screen.queryAllByRole('option');
    expect(options).toHaveLength(0);
  });
});

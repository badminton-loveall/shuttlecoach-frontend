/**
 * CycleFilter Component
 * A dropdown filter for selecting training cycles in the Skill Progression Tracker.
 *
 * Requirements: 6.2, 10.2
 * - Displays available cycles from useSkillScores hook data
 * - Triggers parent re-fetch when cycle selection changes
 */

import React from 'react';

export interface CycleFilterProps {
  selectedCycle: string;
  availableCycles: string[];
  onChange: (cycleKey: string) => void;
}

export const CycleFilter: React.FC<CycleFilterProps> = ({
  selectedCycle,
  availableCycles,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="cycle-filter"
        className="text-sm font-medium text-[var(--text-primary)]"
      >
        Cycle:
      </label>
      <select
        id="cycle-filter"
        value={selectedCycle}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[var(--border-strong)] bg-[var(--surface-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
        aria-label="Select training cycle"
      >
        {availableCycles.map((cycle) => (
          <option key={cycle} value={cycle}>
            {cycle}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CycleFilter;

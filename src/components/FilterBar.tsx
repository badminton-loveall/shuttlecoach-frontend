import React, { useCallback, useMemo } from 'react';
import type { SkillLevel } from '../types';
import './FilterBar.css';

/**
 * FilterBar Component
 * Provides dropdown filters for batch, skill level, and assigned coach.
 * Filters use AND operation — all selected criteria must match.
 */

export interface FilterValues {
  batch: string;
  skillLevel: string;
  coach: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  batchOptions: FilterOption[];
  coachOptions: FilterOption[];
}

const SKILL_LEVEL_OPTIONS: FilterOption[] = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Professional', label: 'Professional' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  batchOptions,
  coachOptions,
}) => {
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.batch) count++;
    if (filters.skillLevel) count++;
    if (filters.coach) count++;
    return count;
  }, [filters]);

  const handleBatchChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({ ...filters, batch: e.target.value });
    },
    [filters, onFilterChange]
  );

  const handleSkillLevelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({ ...filters, skillLevel: e.target.value as SkillLevel | '' });
    },
    [filters, onFilterChange]
  );

  const handleCoachChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({ ...filters, coach: e.target.value });
    },
    [filters, onFilterChange]
  );

  const handleClearAll = useCallback(() => {
    onFilterChange({ batch: '', skillLevel: '', coach: '' });
  }, [onFilterChange]);

  return (
    <div className="filter-bar" role="toolbar" aria-label="Filter students">
      <span className="filter-bar-label">Filters</span>

      {/* Batch Filter */}
      <div className="filter-select-wrapper">
        <select
          className="filter-select"
          value={filters.batch}
          onChange={handleBatchChange}
          aria-label="Filter by batch"
        >
          <option value="">All Batches</option>
          {batchOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="filter-select-arrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Skill Level Filter */}
      <div className="filter-select-wrapper">
        <select
          className="filter-select"
          value={filters.skillLevel}
          onChange={handleSkillLevelChange}
          aria-label="Filter by skill level"
        >
          <option value="">All Levels</option>
          {SKILL_LEVEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="filter-select-arrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Coach Filter */}
      <div className="filter-select-wrapper">
        <select
          className="filter-select"
          value={filters.coach}
          onChange={handleCoachChange}
          aria-label="Filter by assigned coach"
        >
          <option value="">All Coaches</option>
          {coachOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="filter-select-arrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Clear All & Active Count */}
      {activeFilterCount > 0 && (
        <button
          className="filter-clear-all"
          onClick={handleClearAll}
          aria-label="Clear all filters"
          type="button"
        >
          Clear
          <span className="filter-active-count">{activeFilterCount}</span>
        </button>
      )}
    </div>
  );
};

export default FilterBar;

import React, { useEffect, useRef, useState } from 'react';
import type { Drill } from '../types';

/**
 * DrillAutocomplete
 *
 * Replaces the old "pick from a <select>, then separately create a new
 * drill" pair of controls in the set builder with one combobox: type to
 * filter the existing catalog, click a match to add it immediately, or —
 * only when nothing in the catalog already has that exact name — create a
 * new one from what was typed. Matching against the full catalog (not just
 * the drills eligible to add) is what keeps a typo-of-an-existing-name from
 * spawning a duplicate drill instead of surfacing the real one.
 */

interface DrillAutocompleteProps {
  /** Full catalog this builder can draw from, used only for duplicate-name detection. */
  allDrills: Drill[];
  /** Catalog minus drills already in this category — what's actually selectable. */
  eligibleDrills: Drill[];
  onSelectExisting: (drill: Drill) => void;
  /** Omit to disable "create a new drill" entirely (e.g. coaches without that permission). */
  onCreateNew?: (name: string) => void;
  placeholder?: string;
}

export const DrillAutocomplete: React.FC<DrillAutocompleteProps> = ({
  allDrills,
  eligibleDrills,
  onSelectExisting,
  onCreateNew,
  placeholder = 'Type a drill name...',
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmed = query.trim();
  const matches = trimmed
    ? eligibleDrills.filter((d) => d.name.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 8)
    : eligibleDrills.slice(0, 8);

  const exactExists = trimmed
    ? allDrills.some((d) => d.name.trim().toLowerCase() === trimmed.toLowerCase())
    : false;

  const canCreate = !!onCreateNew && !!trimmed && !exactExists;

  const handleSelect = (drill: Drill) => {
    onSelectExisting(drill);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleCreate = () => {
    if (!canCreate || !onCreateNew) return;
    onCreateNew(trimmed);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="drill-autocomplete" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        className="form-input text-sm"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setOpen(false); }
          if (e.key === 'Enter') {
            e.preventDefault();
            if (matches.length > 0) handleSelect(matches[0]);
            else if (canCreate) handleCreate();
          }
        }}
        placeholder={placeholder}
        autoFocus
        aria-label="Search or add a drill"
      />
      {open && (
        <div className="drill-autocomplete__menu">
          {matches.map((d) => (
            <button
              key={d.id}
              type="button"
              className="drill-autocomplete__option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(d)}
            >
              <span>{d.name}</span>
              <span className="drill-autocomplete__option-meta">{d.category}</span>
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              className="drill-autocomplete__option drill-autocomplete__option--create"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCreate}
            >
              + Create &ldquo;{trimmed}&rdquo;
            </button>
          )}
          {matches.length === 0 && !canCreate && (
            <div className="drill-autocomplete__empty">
              {trimmed
                ? (exactExists ? 'Already in this category' : 'No matching drills')
                : 'Type to search the drill catalog'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DrillAutocomplete;

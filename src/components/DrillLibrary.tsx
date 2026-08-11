import React, { useState } from 'react';
import type { Drill } from '../types';
import { useDrills } from '../hooks/useDrills';
import { DRILL_CATEGORIES } from '../constants/drillCategories';

/**
 * DrillLibrary Component
 * Requirements: 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 5.2
 * Fetches drills from API via useDrills hook and provides search, filter, and drag-and-drop functionality.
 */

interface DrillLibraryProps {
  /** Change this value to trigger a refetch of drills from the API */
  refreshTrigger?: number;
}

const DrillLibrary: React.FC<DrillLibraryProps> = ({ refreshTrigger }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const { drills, loading, error, refetch } = useDrills({ refreshTrigger });

  const handleDragStart = (e: React.DragEvent, drill: Drill) => {
    e.dataTransfer.setData('drill', JSON.stringify(drill));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const filteredDrills = drills.filter((drill) => {
    const matchesSearch =
      drill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || drill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Loading state
  if (loading && drills.length === 0) {
    return (
      <div className="card drill-library">
        <div className="drill-library__header">
          <h2 className="text-h3" style={{ margin: '0 0 var(--space-sm)' }}>Drill Library</h2>
        </div>
        <div className="drill-library__list">
          <div className="animate-pulse" style={{ padding: 'var(--space-lg)' }}>
            <div style={{ height: '1rem', background: 'var(--bg-tertiary, #e5e7eb)', borderRadius: '0.25rem', marginBottom: 'var(--space-sm)' }}></div>
            <div style={{ height: '2.5rem', background: 'var(--bg-tertiary, #e5e7eb)', borderRadius: '0.25rem', marginBottom: 'var(--space-sm)' }}></div>
            <div style={{ height: '2.5rem', background: 'var(--bg-tertiary, #e5e7eb)', borderRadius: '0.25rem', marginBottom: 'var(--space-sm)' }}></div>
            <div style={{ height: '2.5rem', background: 'var(--bg-tertiary, #e5e7eb)', borderRadius: '0.25rem', marginBottom: 'var(--space-sm)' }}></div>
            <div style={{ height: '2.5rem', background: 'var(--bg-tertiary, #e5e7eb)', borderRadius: '0.25rem' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && drills.length === 0) {
    return (
      <div className="card drill-library">
        <div className="drill-library__header">
          <h2 className="text-h3" style={{ margin: '0 0 var(--space-sm)' }}>Drill Library</h2>
        </div>
        <div className="drill-library__list" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
          <p className="text-small" style={{ color: 'var(--color-error, #dc2626)', marginBottom: 'var(--space-sm)' }}>
            {error}
          </p>
          <button onClick={() => void refetch()} className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card drill-library">
      {/* Header */}
      <div className="drill-library__header">
        <h2 className="text-h3" style={{ margin: '0 0 var(--space-sm)' }}>Drill Library</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search drills..."
          className="input"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input"
          style={{ marginTop: 'var(--space-sm)' }}
        >
          <option value="All">All Categories</option>
          {DRILL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Drill List */}
      <div className="drill-library__list">
        {filteredDrills.length === 0 ? (
          <p className="text-small" style={{ textAlign: 'center', padding: 'var(--space-lg) 0' }}>No drills found</p>
        ) : (
          filteredDrills.map((drill) => (
            <div
              key={drill.id}
              draggable
              onDragStart={(e) => handleDragStart(e, drill)}
              className="drill-item"
            >
              <div className="drill-item__row">
                <span className="text-body" style={{ fontWeight: 'var(--weight-semibold)' }}>{drill.name}</span>
                <svg className="drill-item__drag-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>
              <span className="badge badge-secondary">{drill.category}</span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="drill-library__footer">
        <p className="text-small" style={{ textAlign: 'center', margin: 0 }}>Drag drills to weekly planners</p>
      </div>
    </div>
  );
};

export default DrillLibrary;

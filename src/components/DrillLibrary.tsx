import React, { useState } from 'react';
import type { Drill } from '../types';
import drillsData from '../data/drills.json';
import { DRILL_CATEGORIES } from '../constants/drillCategories';

/**
 * DrillLibrary Component
 * Requirements: 1.2, 3.1, 3.2, 3.3, 5.2
 * Loads drills from local drills.json and provides search, filter, and drag-and-drop functionality.
 */

const DrillLibrary: React.FC = () => {
  const drills: Drill[] = drillsData.drills as Drill[];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

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

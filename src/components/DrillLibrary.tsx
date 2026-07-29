import React, { useState, useEffect } from 'react';
import type { Drill } from '../types';
import apiClient from '../utils/apiClient';

/**
 * DrillLibrary Component
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * Fetches drills from the API and provides search, filter, and drag-and-drop functionality.
 */

const DrillLibrary: React.FC = () => {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const fetchDrills = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/drills');
      setDrills(response.data.drills);
    } catch (err) {
      setError('Failed to load drills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrills(); }, []);

  const categories = Array.from(new Set(drills.map(d => d.category)));

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

  if (loading) {
    return (
      <div className="card drill-library">
        <div className="drill-library__header">
          <h2 className="text-h3" style={{ margin: '0 0 var(--space-sm)' }}>Drill Library</h2>
        </div>
        <div className="drill-library__list" style={{ textAlign: 'center', padding: 'var(--space-lg) 0' }}>
          <p className="text-small">Loading drills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card drill-library">
        <div className="drill-library__header">
          <h2 className="text-h3" style={{ margin: '0 0 var(--space-sm)' }}>Drill Library</h2>
        </div>
        <div className="drill-library__list" style={{ textAlign: 'center', padding: 'var(--space-lg) 0' }}>
          <p className="text-small" style={{ color: 'var(--color-error, #dc2626)', marginBottom: 'var(--space-sm)' }}>{error}</p>
          <button onClick={fetchDrills} className="btn btn-secondary">Retry</button>
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
          {categories.map((cat) => (
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

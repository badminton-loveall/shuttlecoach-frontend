import React, { useState } from 'react';
import type { Drill } from '../types';

/**
 * DrillLibrary Component
 * Requirements: 18.5, 18.6
 */

const DRILL_LIBRARY: Drill[] = [
  { id: 'drill-001', name: 'Grip Practice', description: 'Practice correct grip technique for forehand and backhand strokes', category: 'Fundamentals' },
  { id: 'drill-002', name: 'Court Movement Patterns', description: 'Basic footwork patterns covering all six court positions', category: 'Footwork' },
  { id: 'drill-003', name: 'Shadow Practice', description: 'Movement without shuttle focusing on footwork and body positioning', category: 'Footwork' },
  { id: 'drill-004', name: 'High Clear Practice', description: 'Repetitive forehand clear shots to baseline with focus on technique', category: 'Stroke Practice' },
  { id: 'drill-005', name: 'Drop Shot Accuracy', description: 'Forehand drop shots targeting net area with controlled power', category: 'Stroke Practice' },
  { id: 'drill-006', name: 'Clear to Drop Combination', description: 'Alternating between clear and drop shots to develop versatility', category: 'Combination Drills' },
  { id: 'drill-007', name: 'Backhand Clear Drills', description: 'Developing power and accuracy in backhand overhead clear', category: 'Stroke Practice' },
  { id: 'drill-008', name: 'Net Shot Practice', description: 'Forehand and backhand net shots with soft touch and precision', category: 'Net Play' },
  { id: 'drill-009', name: 'Net Rush Drills', description: 'Quick movement to net and recovery with proper technique', category: 'Footwork' },
  { id: 'drill-010', name: 'High Service Practice', description: 'Consistent high service to backcourt with proper form', category: 'Service' },
  { id: 'drill-011', name: 'Low Service Precision', description: 'Short service landing just over net with minimal height', category: 'Service' },
  { id: 'drill-012', name: 'Return Positioning', description: 'Proper stance and return technique for various service types', category: 'Return' },
  { id: 'drill-013', name: 'Smash Power Development', description: 'Building explosive power in smash with proper body rotation', category: 'Stroke Practice' },
  { id: 'drill-014', name: 'Defensive Lift Practice', description: 'Returning smashes with controlled lifts to backcourt', category: 'Defense' },
  { id: 'drill-015', name: 'Block and Counter', description: 'Blocking smashes and transitioning to counter-attack', category: 'Defense' },
  { id: 'drill-016', name: 'Sustained Rally Practice', description: 'Maintaining rallies with focus on consistency and placement', category: 'Rally' },
  { id: 'drill-017', name: 'Shot Variation Drills', description: 'Mixing clears, drops, and drives to develop unpredictability', category: 'Combination Drills' },
  { id: 'drill-018', name: 'Tempo Change Practice', description: 'Controlling rally speed from slow build-up to fast exchanges', category: 'Rally' },
  { id: 'drill-019', name: 'Controlled Match Play', description: 'Practice matches with specific tactical objectives', category: 'Match Practice' },
  { id: 'drill-020', name: 'Pressure Situations', description: 'Playing critical points with emphasis on mental composure', category: 'Match Practice' },
];

const CATEGORIES = Array.from(new Set(DRILL_LIBRARY.map((d) => d.category)));

const DrillLibrary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const handleDragStart = (e: React.DragEvent, drill: Drill) => {
    e.dataTransfer.setData('drill', JSON.stringify(drill));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const filteredDrills = DRILL_LIBRARY.filter((drill) => {
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
          {CATEGORIES.map((cat) => (
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

import { useMemo } from 'react';
import './TrainingTab.css';

export interface CurriculumDrillsListProps {
  drills: Array<{ name: string; focusArea: string }>;
  loading?: boolean;
  error?: string | null;
  noBatch?: boolean;
}

/**
 * CurriculumDrillsList
 *
 * Displays curriculum drills grouped by focus area.
 * Handles loading, error, empty, and no-batch states.
 *
 * Requirements: 4.1, 4.2, 4.3
 */
export function CurriculumDrillsList({
  drills,
  loading = false,
  error = null,
  noBatch = false,
}: CurriculumDrillsListProps) {
  const groupedDrills = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const drill of drills) {
      if (!groups[drill.focusArea]) {
        groups[drill.focusArea] = [];
      }
      groups[drill.focusArea].push(drill.name);
    }
    return groups;
  }, [drills]);

  if (loading) {
    return (
      <div className="training-skeleton" aria-label="Loading curriculum drills">
        <div className="training-skeleton__row" />
        <div className="training-skeleton__row" />
        <div className="training-skeleton__row" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="training-error-state">
        <p className="training-error-state__text">{error}</p>
      </div>
    );
  }

  if (noBatch) {
    return (
      <div className="training-empty-state">
        <p className="training-empty-state__text">No curriculum is available</p>
      </div>
    );
  }

  if (drills.length === 0) {
    return (
      <div className="training-empty-state">
        <p className="training-empty-state__text">No curriculum drills assigned</p>
      </div>
    );
  }

  const focusAreas = Object.keys(groupedDrills);

  return (
    <div className="curriculum-drills-list">
      {focusAreas.map((focusArea) => (
        <div key={focusArea} className="focus-area-group">
          <div className="focus-area-group__header">{focusArea}</div>
          <div className="focus-area-group__drills">
            {groupedDrills[focusArea].map((drillName) => (
              <div key={drillName} className="focus-area-group__drill-item">
                {drillName}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CurriculumDrillsList;

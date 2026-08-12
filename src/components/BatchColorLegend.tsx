/**
 * BatchColorLegend Component
 * Displays a horizontal list of color swatches with batch names for the coach calendar view.
 *
 * Requirements: 2.4, 5.1
 * - Shows color legend for batch color coding in multi-batch calendar
 * - Each swatch is a colored circle paired with the batch name
 */

import React from 'react';

export interface BatchColorLegendProps {
  batches: Array<{ batchId: string; batchName: string; color: string }>;
}

export const BatchColorLegend: React.FC<BatchColorLegendProps> = ({ batches }) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', padding: 'var(--space-sm) 0' }}>
      {batches.map(b => (
        <div key={b.batchId} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: b.color,
              display: 'inline-block',
            }}
          />
          <span className="text-small">{b.batchName}</span>
        </div>
      ))}
    </div>
  );
};

export default BatchColorLegend;

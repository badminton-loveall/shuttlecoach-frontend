import React, { useState } from 'react';
import apiClient from '../utils/apiClient';
import { useToast } from '../contexts/ToastContext';

/**
 * FeeAccessToggle Component
 * Renders a toggle switch for managing per-coach fee access permissions.
 *
 * - ASSISTANT_COACH: interactive toggle that calls PATCH /api/coaches/:id/fee-access
 * - HEAD_COACH: disabled toggle shown as "always on" with tooltip
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 10.3
 */

export interface FeeAccessToggleProps {
  coachId: string;
  coachRole: string;
  canAccessFees: boolean;
  onToggle: (id: string, value: boolean) => void;
}

export const FeeAccessToggle: React.FC<FeeAccessToggleProps> = ({
  coachId,
  coachRole,
  canAccessFees,
  onToggle,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { showToast } = useToast();

  const isHeadCoach = coachRole === 'HEAD_COACH';
  const isChecked = isHeadCoach ? true : canAccessFees;

  const handleToggle = async () => {
    if (isHeadCoach || isUpdating) return;

    const newValue = !canAccessFees;

    // Optimistic update
    onToggle(coachId, newValue);
    setIsUpdating(true);

    try {
      await apiClient.patch(`/coaches/${coachId}/fee-access`, {
        canAccessFees: newValue,
      });
    } catch {
      // Revert on error
      onToggle(coachId, canAccessFees);
      showToast({
        message: 'Failed to update fee access. Please try again.',
        type: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fee-access-toggle" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm, 8px)' }}>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={
          isHeadCoach
            ? 'Fee access always enabled for Head Coach'
            : `Toggle fee access for coach`
        }
        disabled={isHeadCoach || isUpdating}
        onClick={handleToggle}
        title={isHeadCoach ? 'Always has fee access' : undefined}
        className="fee-access-toggle__switch"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          border: 'none',
          cursor: isHeadCoach ? 'not-allowed' : isUpdating ? 'wait' : 'pointer',
          backgroundColor: isChecked ? 'var(--color-primary, #4f46e5)' : 'var(--border-default, #d1d5db)',
          opacity: isHeadCoach ? 0.7 : isUpdating ? 0.6 : 1,
          transition: 'background-color 0.2s ease',
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: isChecked ? '22px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
            transition: 'left 0.2s ease',
          }}
        />
      </button>

      {isHeadCoach && (
        <span
          className="text-xs text-gray-500 dark:text-gray-400"
          style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}
        >
          Always on
        </span>
      )}
    </div>
  );
};

export default FeeAccessToggle;

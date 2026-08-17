/**
 * useSessionDrillDown Hook
 * Manages state for session drill-down interactions on the dashboard.
 * Handles session expansion (accordion), student selection, and drawer visibility.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 8.1, 8.2, 8.3
 */

import { useState, useCallback } from 'react';
import type { Student, CalendarEntry } from '../types';

/* --------------------------------------------------------------------------
   Types
   -------------------------------------------------------------------------- */

export interface SessionDrillDownState {
  /** Which session card is currently expanded (null = none) */
  expandedSessionKey: string | null;
  /** Which student's drawer is open (null = none) */
  selectedStudent: Student | null;
  /** Whether the drill drawer is open */
  drawerOpen: boolean;
}

/* --------------------------------------------------------------------------
   Utility
   -------------------------------------------------------------------------- */

/**
 * Generate a deterministic, unique key for a session from its CalendarEntry.
 * Composed as `${batchId}-${date}` for uniqueness across batches and dates.
 *
 * Requirements: 8.1, 8.2, 8.3
 */
export function getSessionKey(entry: CalendarEntry): string {
  return `${entry.batchId}-${entry.date}`;
}

/* --------------------------------------------------------------------------
   Hook
   -------------------------------------------------------------------------- */

const INITIAL_STATE: SessionDrillDownState = {
  expandedSessionKey: null,
  selectedStudent: null,
  drawerOpen: false,
};

/**
 * Custom hook managing the session drill-down interaction state.
 *
 * - Only one session can be expanded at a time (single expansion invariant).
 * - Switching sessions closes the drawer automatically.
 * - Closing the drawer preserves the expanded session.
 */
export function useSessionDrillDown() {
  const [state, setState] = useState<SessionDrillDownState>(INITIAL_STATE);

  /**
   * Toggle session expansion. If the same session is clicked, collapse it.
   * If a different session is clicked, expand the new one and close the drawer.
   *
   * Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.3
   */
  const handleSessionClick = useCallback((session: CalendarEntry) => {
    const key = getSessionKey(session);

    setState((prev) => {
      if (prev.expandedSessionKey === key) {
        // Toggle off — collapse current panel and reset
        return { expandedSessionKey: null, selectedStudent: null, drawerOpen: false };
      }
      // Expand new session, close any open drawer
      return { expandedSessionKey: key, selectedStudent: null, drawerOpen: false };
    });
  }, []);

  /**
   * Select a student and open the drill drawer.
   *
   * Requirements: 4.2
   */
  const handleStudentClick = useCallback((student: Student) => {
    setState((prev) => ({
      ...prev,
      selectedStudent: student,
      drawerOpen: true,
    }));
  }, []);

  /**
   * Close the drill drawer while preserving the expanded session.
   *
   * Requirements: 4.4
   */
  const closeDrawer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedStudent: null,
      drawerOpen: false,
    }));
  }, []);

  /**
   * Reset all state — collapse everything and close the drawer.
   */
  const collapseAll = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    expandedSessionKey: state.expandedSessionKey,
    selectedStudent: state.selectedStudent,
    drawerOpen: state.drawerOpen,
    handleSessionClick,
    handleStudentClick,
    closeDrawer,
    collapseAll,
  };
}

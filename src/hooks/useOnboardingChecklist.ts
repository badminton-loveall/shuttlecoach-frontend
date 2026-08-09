/**
 * useOnboardingChecklist Hook
 * Fetches and manages the center onboarding checklist state.
 * Requirements: 3.1, 4.1, 4.5, 5.6
 *
 * - Fetches checklist status from API on mount (HEAD_COACH only)
 * - Handles dismiss action
 * - Gracefully hides widget on API error or timeout (10s)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../utils/apiClient';

export interface ChecklistItemResponse {
  key: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
  link: string;
}

export interface OnboardingChecklistResponse {
  items: ChecklistItemResponse[];
  allComplete: boolean;
  dismissedAt: string | null;
}

export interface UseOnboardingChecklistReturn {
  checklist: OnboardingChecklistResponse | null;
  loading: boolean;
  error: string | null;
  dismiss: () => Promise<void>;
  dismissing: boolean;
}

/**
 * Hook providing onboarding checklist data and dismiss functionality.
 * On API error or timeout, checklist is set to null so the widget hides gracefully.
 */
export function useOnboardingChecklist(): UseOnboardingChecklistReturn {
  const [checklist, setChecklist] = useState<OnboardingChecklistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    const fetchChecklist = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<OnboardingChecklistResponse>(
          '/onboarding-checklist',
          { signal: controller.signal }
        );
        setChecklist(response.data);
      } catch {
        // On any error (network, timeout, 4xx, 5xx): hide widget gracefully
        setChecklist(null);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    void fetchChecklist();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const dismiss = useCallback(async () => {
    setDismissing(true);
    setError(null);
    try {
      const response = await apiClient.post<{ success: boolean; dismissedAt: string }>(
        '/onboarding-checklist/dismiss'
      );
      if (response.data.success) {
        setChecklist((prev) =>
          prev ? { ...prev, dismissedAt: response.data.dismissedAt } : prev
        );
      }
    } catch {
      setError('Could not dismiss checklist. Please try again.');
    } finally {
      setDismissing(false);
    }
  }, []);

  return {
    checklist,
    loading,
    error,
    dismiss,
    dismissing,
  };
}

/**
 * Preservation Property Tests - apiClient Auth Interceptor
 *
 * Validates: Requirements 3.5
 *
 * Tests that the 401 response interceptor correctly:
 * - Clears localStorage auth state
 * - Redirects to /login
 *
 * This behavior MUST be preserved after the fix.
 * This test MUST PASS on unfixed code.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';

// We need to test the real interceptor behavior from apiClient.ts
// So we import the real module after setting up the environment

describe('apiClient - Preservation: Auth interceptor on 401', () => {
  let originalLocation: Location;
  let mockLocation: { href: string };

  beforeEach(() => {
    // Store original location and mock it
    originalLocation = window.location;
    mockLocation = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    // Set up auth tokens in localStorage
    localStorage.setItem('auth_token', 'test-jwt-token');
    localStorage.setItem('auth_user', JSON.stringify({ id: 'user-1', name: 'Test User' }));
    localStorage.setItem('auth_role', 'COACH');
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('when API returns 401, localStorage is cleared and window.location is set to /login', async () => {
    /**
     * Validates: Requirements 3.5
     *
     * The apiClient response interceptor handles 401 errors by:
     * 1. Removing auth_token, auth_user, auth_role from localStorage
     * 2. Setting window.location.href to '/login'
     *
     * This preservation test ensures this behavior continues after the fix.
     */

    // We need to dynamically import apiClient to get the real interceptors
    // Reset module registry to ensure a fresh import
    vi.resetModules();

    // Mock window.location before importing
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    // Set auth tokens before import
    localStorage.setItem('auth_token', 'test-jwt-token');
    localStorage.setItem('auth_user', JSON.stringify({ id: 'user-1', name: 'Test User' }));
    localStorage.setItem('auth_role', 'COACH');

    // Import apiClient (which registers interceptors on import)
    const { default: apiClient } = await import('../utils/apiClient');

    // Mock the axios adapter to simulate a 401 response
    const mockAdapter = vi.fn().mockRejectedValue({
      response: { status: 401, data: { message: 'Unauthorized' } },
      isAxiosError: true,
      config: {},
    } as Partial<AxiosError>);

    // Use axios interceptors directly - trigger a request that returns 401
    try {
      // Override the adapter on the instance to simulate a 401
      apiClient.defaults.adapter = mockAdapter;
      await apiClient.get('/some-protected-endpoint');
    } catch {
      // Expected to throw - the interceptor rejects with the error
    }

    // Verify localStorage is cleared
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(localStorage.getItem('auth_role')).toBeNull();

    // Verify redirect to /login
    expect(mockLocation.href).toBe('/login');
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock apiClient so no real network calls are made.
vi.mock('../utils/apiClient', () => {
  const USERS: Record<string, { id: string; username: string; password: string; role: string; name: string; email: string; profilePhoto: null; specialization: null | string; createdAt: string; lastActive: string }> = {
    head_coach:        { id: 'user-001', username: 'head_coach',       password: 'password123', role: 'HEAD_COACH',       name: 'Sumit Dali',   email: 'rajesh@shuttlecoach.com', profilePhoto: null, specialization: null,               createdAt: '2026-01-01T08:00:00Z', lastActive: '2026-01-15T10:30:00Z' },
    assistant_coach1:  { id: 'user-002', username: 'assistant_coach1', password: 'password123', role: 'ASSISTANT_COACH', name: 'Priya Sharma',  email: 'priya@shuttlecoach.com',  profilePhoto: null, specialization: 'Doubles Training', createdAt: '2026-01-02T08:00:00Z', lastActive: '2026-01-14T14:20:00Z' },
    assistant_coach2:  { id: 'user-003', username: 'assistant_coach2', password: 'password123', role: 'ASSISTANT_COACH', name: 'Vikram Singh',  email: 'vikram@shuttlecoach.com', profilePhoto: null, specialization: 'Footwork & Movement', createdAt: '2026-01-03T08:00:00Z', lastActive: '2026-01-13T09:15:00Z' },
    student1:          { id: 'user-004', username: 'student1',         password: 'password123', role: 'STUDENT',         name: 'Aarav Patel',   email: 'aarav.patel@student.com', profilePhoto: null, specialization: null,               createdAt: '2026-01-05T08:00:00Z', lastActive: '2026-01-15T16:45:00Z' },
    student2:          { id: 'user-005', username: 'student2',         password: 'password123', role: 'STUDENT',         name: 'Divya Gupta',   email: 'divya.gupta@student.com', profilePhoto: null, specialization: null,               createdAt: '2026-01-06T08:00:00Z', lastActive: '2026-01-12T11:20:00Z' },
  };

  const post = vi.fn(async (_url: string, body: { username: string; password: string }) => {
    const { username, password } = body;
    const user = USERS[username];
    if (!user || user.password !== password) {
      const err = new Error('Invalid username or password');
      (err as any).response = { status: 401, data: { message: 'Invalid username or password' } };
      return Promise.reject(err);
    }
    const { password: _pw, ...safeUser } = user;
    void _pw;
    const token = `${safeUser.id}:${Date.now()}`;
    return {
      data: {
        token,
        user: safeUser,
        role: safeUser.role,
      },
    };
  });

  return {
    default: { post },
  };
});

/**
 * Property-Based Tests for AuthContext
 * **Validates: Requirements 1.2, 1.3, 29.3, 29.4, 29.5**
 *
 * These tests verify universal properties that must hold for all valid inputs
 * and usage patterns of the authentication context.
 */

describe('AuthContext - Property-Based Tests', () => {
  /**
   * Property 1: After successful login, isAuthenticated must be true
   * and user, role, token must all be non-null
   *
   * **Validates: Requirement 1.2 - Valid authentication transitions to authenticated state**
   */
  it('Property: Successful login results in authenticated state with all required fields', async () => {
    const validCredentials = [
      { username: 'head_coach', password: 'password123' },
      { username: 'assistant_coach1', password: 'password123' },
      { username: 'assistant_coach2', password: 'password123' },
      { username: 'student1', password: 'password123' },
      { username: 'student2', password: 'password123' },
    ];

    for (const credentials of validCredentials) {
      let contextValue: any = null;

      const TestComponent = () => {
        contextValue = useAuth();
        return null;
      };

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });

      await contextValue.login(credentials.username, credentials.password);

      await waitFor(() => {
        // Property: isAuthenticated is true
        expect(contextValue.isAuthenticated).toBe(true);

        // Property: user is not null
        expect(contextValue.user).not.toBeNull();

        // Property: role is not null
        expect(contextValue.role).not.toBeNull();

        // Property: token is not null
        expect(contextValue.token).not.toBeNull();

        // Property: user has required fields
        expect(contextValue.user).toHaveProperty('id');
        expect(contextValue.user).toHaveProperty('username');
        expect(contextValue.user).toHaveProperty('role');
        expect(contextValue.user).toHaveProperty('name');
        expect(contextValue.user).toHaveProperty('createdAt');
        expect(contextValue.user).toHaveProperty('lastActive');
      });

      unmount();
      localStorage.clear();
    }
  });

  /**
   * Property 2: Invalid credentials always result in error
   * and authentication state remains unauthenticated
   *
   * **Validates: Requirement 1.3 - Invalid credentials are rejected**
   */
  it('Property: Invalid credentials always fail and leave state unauthenticated', async () => {
    const invalidCredentialsVariations = [
      { username: 'nonexistent_user', password: 'password123' },
      { username: 'head_coach', password: 'wrong_password' },
      { username: 'head_coach', password: '' },
      { username: '', password: 'password123' },
      { username: 'student1', password: 'password456' },
    ];

    for (const credentials of invalidCredentialsVariations) {
      let contextValue: any = null;

      const TestComponent = () => {
        contextValue = useAuth();
        return null;
      };

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });

      // Property: login throws error
      try {
        await contextValue.login(credentials.username, credentials.password);
        expect.fail(`Should have failed for ${JSON.stringify(credentials)}`);
      } catch (error) {
        // Property: error message is consistent
        expect((error as Error).message).toBe('Invalid username or password');
      }

      // Property: state remains unauthenticated after failed login
      await waitFor(() => {
        expect(contextValue.isAuthenticated).toBe(false);
        expect(contextValue.user).toBeNull();
        expect(contextValue.role).toBeNull();
        expect(contextValue.token).toBeNull();
      });

      unmount();
      localStorage.clear();
    }
  });

  /**
   * Property 3: After logout, all auth state is cleared
   * and localStorage is empty
   *
   * **Validates: Requirement 29.3 - Authentication state persists in localStorage**
   */
  it('Property: Logout always clears all authentication state and localStorage', async () => {
    let contextValue: any = null;

    const TestComponent = () => {
      contextValue = useAuth();
      return null;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(contextValue).toBeDefined();
    });

    await contextValue.login('head_coach', 'password123');

    await waitFor(() => {
      expect(contextValue.isAuthenticated).toBe(true);
    });

    // Property: All localStorage keys are set before logout
    expect(localStorage.getItem('auth_token')).not.toBeNull();
    expect(localStorage.getItem('auth_user')).not.toBeNull();
    expect(localStorage.getItem('auth_role')).not.toBeNull();

    contextValue.logout();

    // Property: After logout, all auth state is null
    await waitFor(() => {
      expect(contextValue.user).toBeNull();
      expect(contextValue.role).toBeNull();
      expect(contextValue.token).toBeNull();
      expect(contextValue.isAuthenticated).toBe(false);
    });

    // Property: After logout, all localStorage keys are cleared
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(localStorage.getItem('auth_role')).toBeNull();
  });

  /**
   * Property 4: localStorage data persists and restores correctly
   * across component mount/unmount cycles
   *
   * **Validates: Requirement 29.4 - JSON data persistence with localStorage**
   */
  it('Property: localStorage correctly persists and restores authentication state', async () => {
    // Step 1: Login and store
    let contextValue1: any = null;

    const TestComponent1 = () => {
      contextValue1 = useAuth();
      return null;
    };

    const { unmount } = render(
      <AuthProvider>
        <TestComponent1 />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(contextValue1).toBeDefined();
    });

    await contextValue1.login('assistant_coach1', 'password123');

    await waitFor(() => {
      expect(contextValue1.isAuthenticated).toBe(true);
    });

    // Property: Data is stored in localStorage
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    const storedRole = localStorage.getItem('auth_role');

    expect(storedToken).not.toBeNull();
    expect(storedUser).not.toBeNull();
    expect(storedRole).not.toBeNull();

    unmount();

    // Step 2: Create new component and verify restoration
    let contextValue2: any = null;

    const TestComponent2 = () => {
      contextValue2 = useAuth();
      return null;
    };

    render(
      <AuthProvider>
        <TestComponent2 />
      </AuthProvider>
    );

    // Property: Restored state matches original state
    await waitFor(() => {
      expect(contextValue2.isAuthenticated).toBe(true);
      expect(contextValue2.user?.username).toBe('assistant_coach1');
      expect(contextValue2.role).toBe('ASSISTANT_COACH');
      expect(contextValue2.token).toBe(storedToken);
    });

    // Property: Restored user object has all required fields
    const restoredUser = contextValue2.user;
    expect(restoredUser).toHaveProperty('id');
    expect(restoredUser).toHaveProperty('username');
    expect(restoredUser).toHaveProperty('role');
    expect(restoredUser).toHaveProperty('email');
  });

  /**
   * Property 5: User role is correctly set and matches credentials
   * for all user types (HEAD_COACH, ASSISTANT_COACH, STUDENT)
   *
   * **Validates: Requirement 29.5 - Sample users include all required roles**
   */
  it('Property: User roles are correctly assigned based on credentials for all user types', async () => {
    const roleMapping = new Map<string, string>([
      ['head_coach', 'HEAD_COACH'],
      ['assistant_coach1', 'ASSISTANT_COACH'],
      ['assistant_coach2', 'ASSISTANT_COACH'],
      ['student1', 'STUDENT'],
      ['student2', 'STUDENT'],
    ]);

    for (const [username, expectedRole] of roleMapping) {
      let contextValue: any = null;

      const TestComponent = () => {
        contextValue = useAuth();
        return null;
      };

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });

      await contextValue.login(username, 'password123');

      await waitFor(() => {
        // Property: role in context matches expected role
        expect(contextValue.role).toBe(expectedRole);

        // Property: role in user object matches context role
        expect(contextValue.user?.role).toBe(expectedRole);

        // Property: role is one of the valid types
        expect(['HEAD_COACH', 'ASSISTANT_COACH', 'STUDENT']).toContain(contextValue.role);
      });

      unmount();
      localStorage.clear();
    }
  });

  /**
   * Property 6: Token format is consistent and contains user identification
   * and timestamp information
   *
   * **Validates: Requirement 1.2 - JWT-like token generation**
   */
  it('Property: Token format is consistent with user ID and timestamp', async () => {
    const testUsers = ['head_coach', 'assistant_coach1', 'student1'];

    for (const username of testUsers) {
      let contextValue: any = null;

      const TestComponent = () => {
        contextValue = useAuth();
        return null;
      };

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });

      await contextValue.login(username, 'password123');

      await waitFor(() => {
        const token = contextValue.token;

        // Property: Token is a string
        expect(typeof token).toBe('string');

        // Property: Token contains colon separator
        expect(token).toContain(':');

        // Property: Token format matches user-id:timestamp
        const tokenParts = token.split(':');
        expect(tokenParts.length).toBe(2);

        const [userId, timestamp] = tokenParts;

        // Property: User ID is valid
        expect(userId).toMatch(/^user-\d{3}$/);

        // Property: Timestamp is a valid number
        expect(!isNaN(Number(timestamp))).toBe(true);
        expect(Number(timestamp) > 0).toBe(true);
      });

      unmount();
      localStorage.clear();
    }
  });

  /**
   * Property 7: User object never contains password or passwordHash
   * regardless of input credentials
   *
   * **Validates: Security requirement - passwords never exposed in frontend**
   */
  it('Property: User object never contains password regardless of input', async () => {
    const testCases = [
      { username: 'head_coach', password: 'password123' },
      { username: 'assistant_coach1', password: 'password123' },
      { username: 'student1', password: 'password123' },
    ];

    for (const { username, password } of testCases) {
      let contextValue: any = null;

      const TestComponent = () => {
        contextValue = useAuth();
        return null;
      };

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
      });

      await contextValue.login(username, password);

      await waitFor(() => {
        const user = contextValue.user;

        // Property: User object does not have password property
        expect(user).not.toHaveProperty('password');

        // Property: User object does not have passwordHash property
        expect(user).not.toHaveProperty('passwordHash');

        // Property: Stored user in localStorage also doesn't have password
        const storedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
        expect(storedUser).not.toHaveProperty('password');
        expect(storedUser).not.toHaveProperty('passwordHash');
      });

      unmount();
      localStorage.clear();
    }
  });

  /**
   * Property 8: AuthProvider always completes loading and renders children
   * regardless of initial localStorage state
   *
   * **Validates: Requirement 1.2 - Authentication context is always available**
   */
  it('Property: AuthProvider completes loading and renders children in all scenarios', async () => {
    // Scenario 1: Empty localStorage
    let contextValue1: any = null;

    const TestComponent1 = () => {
      contextValue1 = useAuth();
      return <div>Loaded</div>;
    };

    const { getByText: getByText1 } = render(
      <AuthProvider>
        <TestComponent1 />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText1('Loaded')).toBeDefined();
      expect(contextValue1.isAuthenticated).toBe(false);
    });

    // Scenario 2: Valid localStorage data
    await new Promise((resolve) => {
      let contextValue2: any = null;

      const TestComponent2 = () => {
        contextValue2 = useAuth();
        return null;
      };

      render(
        <AuthProvider>
          <TestComponent2 />
        </AuthProvider>
      );

      waitFor(() => {
        expect(contextValue2).toBeDefined();
      }).then(() => {
        contextValue2.login('head_coach', 'password123').then(() => {
          resolve(null);
        });
      });
    });

    localStorage.clear();

    // Scenario 3: Invalid localStorage data (should clear and continue)
    localStorage.setItem('auth_token', 'invalid');
    localStorage.setItem('auth_user', 'not-json');

    let contextValue3: any = null;

    const TestComponent3 = () => {
      contextValue3 = useAuth();
      return <div>Loaded with invalid data</div>;
    };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText: getByText3 } = render(
      <AuthProvider>
        <TestComponent3 />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText3('Loaded with invalid data')).toBeDefined();
      expect(contextValue3.isAuthenticated).toBe(false);
    });

    consoleSpy.mockRestore();
  });
});

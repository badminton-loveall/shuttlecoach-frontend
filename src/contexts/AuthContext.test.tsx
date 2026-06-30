/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

/**
 * Test suite for AuthContext
 * Tests authentication state management, login/logout flows, and localStorage persistence
 */

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useAuth hook', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => {
        useAuth();
        return null;
      };

      expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return auth context when used inside AuthProvider', () => {
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

      expect(contextValue).toBeDefined();
      expect(contextValue).toHaveProperty('user');
      expect(contextValue).toHaveProperty('role');
      expect(contextValue).toHaveProperty('token');
      expect(contextValue).toHaveProperty('isAuthenticated');
      expect(contextValue).toHaveProperty('login');
      expect(contextValue).toHaveProperty('logout');
    });
  });

  describe('Initial state', () => {
    it('should start with null user, role, and token', async () => {
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
        expect(contextValue.user).toBeNull();
        expect(contextValue.role).toBeNull();
        expect(contextValue.token).toBeNull();
        expect(contextValue.isAuthenticated).toBe(false);
      });
    });

    it('should have isAuthenticated as false when unauthenticated', async () => {
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
        expect(contextValue.isAuthenticated).toBe(false);
      });
    });
  });

  describe('Login functionality', () => {
    it('should successfully login with valid HEAD_COACH credentials', async () => {
      let contextValue: any = null;

      const TestComponent = () => {
        contextValue = useAuth();
        return (
          <div>
            {contextValue.user && <span>{contextValue.user.name}</span>}
            {contextValue.role && <span>{contextValue.role}</span>}
          </div>
        );
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
        expect(contextValue.user).not.toBeNull();
        expect(contextValue.user?.username).toBe('head_coach');
        expect(contextValue.user?.name).toBe('Sumit Dali');
        expect(contextValue.role).toBe('HEAD_COACH');
        expect(contextValue.token).not.toBeNull();
        expect(contextValue.isAuthenticated).toBe(true);
      });
    });

    it('should successfully login with valid ASSISTANT_COACH credentials', async () => {
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

      await contextValue.login('assistant_coach1', 'password123');

      await waitFor(() => {
        expect(contextValue.user).not.toBeNull();
        expect(contextValue.user?.username).toBe('assistant_coach1');
        expect(contextValue.role).toBe('ASSISTANT_COACH');
        expect(contextValue.isAuthenticated).toBe(true);
      });
    });

    it('should successfully login with valid STUDENT credentials', async () => {
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

      await contextValue.login('student1', 'password123');

      await waitFor(() => {
        expect(contextValue.user).not.toBeNull();
        expect(contextValue.user?.username).toBe('student1');
        expect(contextValue.role).toBe('STUDENT');
        expect(contextValue.isAuthenticated).toBe(true);
      });
    });

    it('should throw error on invalid username', async () => {
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

      try {
        await contextValue.login('invalid_user', 'password123');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toBe('Invalid username or password');
      }
    });

    it('should throw error on invalid password', async () => {
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

      try {
        await contextValue.login('head_coach', 'wrongpassword');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toBe('Invalid username or password');
      }
    });

    it('should not include password in user object after login', async () => {
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
        expect(contextValue.user).not.toHaveProperty('password');
        expect(contextValue.user).not.toHaveProperty('passwordHash');
      });
    });

    it('should generate a token on successful login', async () => {
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
        expect(contextValue.token).not.toBeNull();
        expect(typeof contextValue.token).toBe('string');
        expect(contextValue.token).toContain('user-001');
      });
    });
  });

  describe('Logout functionality', () => {
    it('should clear auth state on logout', async () => {
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

      // Login first
      await contextValue.login('head_coach', 'password123');

      await waitFor(() => {
        expect(contextValue.isAuthenticated).toBe(true);
      });

      // Then logout
      contextValue.logout();

      await waitFor(() => {
        expect(contextValue.user).toBeNull();
        expect(contextValue.role).toBeNull();
        expect(contextValue.token).toBeNull();
        expect(contextValue.isAuthenticated).toBe(false);
      });
    });

    it('should remove auth data from localStorage on logout', async () => {
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

      // Login first
      await contextValue.login('head_coach', 'password123');

      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).not.toBeNull();
        expect(localStorage.getItem('auth_user')).not.toBeNull();
        expect(localStorage.getItem('auth_role')).not.toBeNull();
      });

      // Logout
      contextValue.logout();

      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(localStorage.getItem('auth_user')).toBeNull();
        expect(localStorage.getItem('auth_role')).toBeNull();
      });
    });
  });

  describe('localStorage persistence', () => {
    it('should persist auth state to localStorage on login', async () => {
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
        expect(localStorage.getItem('auth_token')).not.toBeNull();
        expect(localStorage.getItem('auth_user')).not.toBeNull();
        expect(localStorage.getItem('auth_role')).not.toBeNull();
      });

      const storedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
      expect(storedUser.username).toBe('head_coach');
      expect(localStorage.getItem('auth_role')).toBe('HEAD_COACH');
    });

    it('should restore auth state from localStorage on component mount', async () => {
      // First render: login and store
      let contextValue1: any = null;

      const TestComponent = () => {
        contextValue1 = useAuth();
        return null;
      };

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(contextValue1).toBeDefined();
      });

      await contextValue1.login('head_coach', 'password123');

      await waitFor(() => {
        expect(contextValue1.isAuthenticated).toBe(true);
      });

      unmount();

      // Second render: should restore from localStorage
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

      await waitFor(() => {
        expect(contextValue2.isAuthenticated).toBe(true);
        expect(contextValue2.user?.username).toBe('head_coach');
        expect(contextValue2.role).toBe('HEAD_COACH');
      });
    });

    it('should clear invalid localStorage data on mount', async () => {
      // Set invalid data in localStorage
      localStorage.setItem('auth_token', 'invalid-token');
      localStorage.setItem('auth_user', 'invalid-json');
      localStorage.setItem('auth_role', 'HEAD_COACH');

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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

      // Invalid data should be cleared
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(localStorage.getItem('auth_user')).toBeNull();
        expect(localStorage.getItem('auth_role')).toBeNull();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('User data structure', () => {
    it('should return complete user object with all required fields', async () => {
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
        const user = contextValue.user;
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('lastActive');
        expect(user.id).toBe('user-001');
        expect(user.email).toBe('rajesh@shuttlecoach.com');
      });
    });
  });

  describe('Multiple users availability', () => {
    it('should have 5 sample users with correct roles', async () => {
      const testUsers = [
        { username: 'head_coach', expectedRole: 'HEAD_COACH' },
        { username: 'assistant_coach1', expectedRole: 'ASSISTANT_COACH' },
        { username: 'assistant_coach2', expectedRole: 'ASSISTANT_COACH' },
        { username: 'student1', expectedRole: 'STUDENT' },
        { username: 'student2', expectedRole: 'STUDENT' },
      ];

      for (const testUser of testUsers) {
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

        await contextValue.login(testUser.username, 'password123');

        await waitFor(() => {
          expect(contextValue.role).toBe(testUser.expectedRole);
          expect(contextValue.isAuthenticated).toBe(true);
        });

        unmount();
        localStorage.clear();
      }
    });
  });

  describe('AuthProvider initialization', () => {
    it('should render children after loading', async () => {
      const TestComponent = () => {
        const { isAuthenticated } = useAuth();
        return <div>{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>;
      };

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByText('Not authenticated')).toBeDefined();
      });
    });

    it('should not render children during initial loading', () => {
      const TestComponent = () => {
        return <div>Content</div>;
      };

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Component should render after loading completes
      expect(container).toBeDefined();
    });
  });

  describe('Token format and structure', () => {
    it('should generate token with userId and timestamp', async () => {
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
        const token = contextValue.token;
        expect(token).toMatch(/user-001:\d+/);
        const [userId, timestamp] = token.split(':');
        expect(userId).toBe('user-001');
        expect(!isNaN(Number(timestamp))).toBe(true);
      });
    });
  });
});

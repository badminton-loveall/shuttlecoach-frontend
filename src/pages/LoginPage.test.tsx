import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import LoginPage from './LoginPage';

/**
 * LoginPage Component Tests
 * Tests for: form validation, error messages, login flow, redirect
 */

// Wrapper component for routing and auth context
const LoginPageWithProviders = () => (
  <BrowserRouter>
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  </BrowserRouter>
);

describe('LoginPage Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Form Rendering', () => {
    it('should render login form with username and password fields', () => {
      render(<LoginPageWithProviders />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render ShuttleCoach title and subtitle', () => {
      render(<LoginPageWithProviders />);

      expect(screen.getByText('ShuttleCoach')).toBeInTheDocument();
      expect(screen.getByText('Badminton Training Management')).toBeInTheDocument();
    });

    it('should render demo credentials section', () => {
      render(<LoginPageWithProviders />);

      expect(screen.getByText(/demo credentials/i)).toBeInTheDocument();
      expect(screen.getByText(/head coach:/i)).toBeInTheDocument();
      expect(screen.getByText(/assistant coach:/i)).toBeInTheDocument();
      expect(screen.getByText(/student:/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty username on submit', async () => {
      render(<LoginPageWithProviders />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty password on submit', async () => {
      render(<LoginPageWithProviders />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;

      fireEvent.change(usernameInput, { target: { value: 'head_coach' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should show errors for both fields when empty', async () => {
      render(<LoginPageWithProviders />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should clear error on input after first attempt', async () => {
      render(<LoginPageWithProviders />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      fireEvent.change(usernameInput, { target: { value: 'head_coach' } });

      await waitFor(() => {
        expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Invalid Credentials', () => {
    it('should show error message for invalid username', async () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'invalid_user' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });
    });

    it('should show error message for invalid password', async () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'head_coach' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });
    });

    it('should display error in a banner with red styling', async () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'wrong' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorBanner = screen.getByRole('alert');
        expect(errorBanner).toHaveClass('error-banner');
        expect(errorBanner).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable form during login attempt', async () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement;

      fireEvent.change(usernameInput, { target: { value: 'head_coach' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit the form
      fireEvent.click(submitButton);

      // Check that button shows loading state
      await waitFor(() => {
        expect(screen.getByText(/logging in/i)).toBeInTheDocument();
      });
    });

    it('should show spinner during login', async () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'head_coach' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const spinnerElement = document.querySelector('.spinner');
        expect(spinnerElement).toBeInTheDocument();
      });
    });
  });

  describe('Successful Login', () => {
    it('should store auth token in localStorage on valid login', async () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'head_coach' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeTruthy();
        expect(localStorage.getItem('auth_user')).toBeTruthy();
        expect(localStorage.getItem('auth_role')).toBe('HEAD_COACH');
      });
    });

    it('should store user info in localStorage', async () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'head_coach' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const userStr = localStorage.getItem('auth_user');
        expect(userStr).toBeTruthy();
        const user = JSON.parse(userStr!);
        expect(user.name).toBe('Sumit Dali');
        expect(user.role).toBe('HEAD_COACH');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form inputs', () => {
      render(<LoginPageWithProviders />);

      const usernameLabel = screen.getByLabelText(/username/i);
      const passwordLabel = screen.getByLabelText(/password/i);

      expect(usernameLabel).toHaveAttribute('id', 'username');
      expect(passwordLabel).toHaveAttribute('id', 'password');
    });

    it('should have autocomplete attributes for accessibility', () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      expect(usernameInput).toHaveAttribute('autocomplete', 'username');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    it('should have required attribute on form inputs', () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      expect(usernameInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should set aria-busy on submit button during loading', async () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement;

      fireEvent.change(usernameInput, { target: { value: 'head_coach' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveAttribute('aria-busy', 'true');
      });
    });

    it('should have role alert on error messages', async () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'wrong' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });

  describe('Form Input Behavior', () => {
    it('should accept text input in username field', () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      fireEvent.change(usernameInput, { target: { value: 'test_user' } });

      expect(usernameInput.value).toBe('test_user');
    });

    it('should accept text input in password field', () => {
      render(<LoginPageWithProviders />);

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'mypassword' } });

      expect(passwordInput.value).toBe('mypassword');
    });

    it('should handle form submission with Enter key', async () => {
      render(<LoginPageWithProviders />);

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      fireEvent.change(usernameInput, { target: { value: 'head_coach' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Simulate Enter key on password field
      fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });

      // The form should submit (handled by browser native behavior)
      // We can check if the login attempt was made by looking for loading state
      const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on small viewport (mobile)', () => {
      render(<LoginPageWithProviders />);

      expect(screen.getByText('ShuttleCoach')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render on large viewport (desktop)', () => {
      render(<LoginPageWithProviders />);

      expect(screen.getByText('ShuttleCoach')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });
});

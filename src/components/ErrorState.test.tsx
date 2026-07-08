/**
 * Tests for ErrorState component
 * Tests display of different error types with retry capability
 * 
 * Requirements: 21.2, 21.3, 21.4, 24.3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  describe('404 Not Found errors', () => {
    it('should display not found error message', () => {
      const error = new Error('Request failed with status code 404');
      (error as any).response = { status: 404 };

      render(<ErrorState error={error} onRetry={vi.fn()} />);

      expect(screen.getByText('Not Found')).toBeInTheDocument();
      expect(screen.getByText(/requested resource was not found/i)).toBeInTheDocument();
    });

    it('should not show retry button for 404 errors', () => {
      const error = new Error('Request failed with status code 404');
      (error as any).response = { status: 404 };

      const { queryByLabelText } = render(<ErrorState error={error} onRetry={vi.fn()} />);

      expect(queryByLabelText('Retry loading data')).not.toBeInTheDocument();
    });
  });

  describe('403 Permission Denied errors', () => {
    it('should display permission denied error message', () => {
      const error = new Error('Request failed with status code 403');
      (error as any).response = { status: 403 };

      render(<ErrorState error={error} onRetry={vi.fn()} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
    });

    it('should not show retry button for 403 errors', () => {
      const error = new Error('Request failed with status code 403');
      (error as any).response = { status: 403 };

      const { queryByLabelText } = render(<ErrorState error={error} onRetry={vi.fn()} />);

      expect(queryByLabelText('Retry loading data')).not.toBeInTheDocument();
    });
  });

  describe('500 Server errors', () => {
    it('should display server error message', () => {
      const error = new Error('Request failed with status code 500');
      (error as any).response = { status: 500 };

      render(<ErrorState error={error} onRetry={vi.fn()} />);

      expect(screen.getByText('Server Error')).toBeInTheDocument();
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument();
    });

    it('should show retry button for 500 errors', () => {
      const error = new Error('Request failed with status code 500');
      (error as any).response = { status: 500 };

      render(<ErrorState error={error} onRetry={vi.fn()} />);

      expect(screen.getByLabelText('Retry loading data')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const error = new Error('Request failed with status code 500');
      (error as any).response = { status: 500 };
      const onRetry = vi.fn();

      render(<ErrorState error={error} onRetry={onRetry} />);

      const retryButton = screen.getByLabelText('Retry loading data');
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Network errors', () => {
    it('should display network error message', () => {
      const error = new Error('Network Error');
      (error as any).code = 'ECONNABORTED';

      render(<ErrorState error={error} onRetry={vi.fn()} />);

      expect(screen.getByText('Network Error')).toBeInTheDocument();
      expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument();
    });

    it('should show retry button for network errors', () => {
      const error = new Error('Network Error');
      (error as any).code = 'ECONNABORTED';

      render(<ErrorState error={error} onRetry={vi.fn()} />);

      expect(screen.getByLabelText('Retry loading data')).toBeInTheDocument();
    });

    it('should suggest checking connection for network errors', () => {
      const error = new Error('Network Error');
      (error as any).code = 'ECONNABORTED';

      render(<ErrorState error={error} onRetry={vi.fn()} />);

      expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
    });
  });

  describe('Custom title and description', () => {
    it('should display custom title when provided', () => {
      const error = new Error('Something failed');
      const customTitle = 'Custom Error Title';

      render(<ErrorState error={error} onRetry={vi.fn()} title={customTitle} />);

      expect(screen.getByText(customTitle)).toBeInTheDocument();
    });

    it('should display custom description when provided', () => {
      const error = new Error('Something failed');
      const customDescription = 'This is a custom description';

      render(
        <ErrorState error={error} onRetry={vi.fn()} description={customDescription} />
      );

      expect(screen.getByText(customDescription)).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should disable retry button when isRetrying is true', () => {
      const error = new Error('Request failed with status code 500');
      (error as any).response = { status: 500 };

      render(<ErrorState error={error} onRetry={vi.fn()} isRetrying={true} />);

      const retryButton = screen.getByLabelText('Retry loading data') as HTMLButtonElement;
      expect(retryButton.disabled).toBe(true);
    });

    it('should show retrying text when isRetrying is true', () => {
      const error = new Error('Request failed with status code 500');
      (error as any).response = { status: 500 };

      render(<ErrorState error={error} onRetry={vi.fn()} isRetrying={true} />);

      expect(screen.getByText('Retrying...')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render inline variant by default', () => {
      const error = new Error('Something failed');
      const { container } = render(<ErrorState error={error} onRetry={vi.fn()} />);

      // Inline variant has role="alert"
      expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
    });

    it('should render page variant when specified', () => {
      const error = new Error('Something failed');
      const { container } = render(
        <ErrorState error={error} onRetry={vi.fn()} variant="page" />
      );

      // Page variant has min-h-screen
      const pageDiv = container.querySelector('.min-h-screen');
      expect(pageDiv).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper role="alert" for screen readers', () => {
      const error = new Error('Something failed');
      const { container } = render(<ErrorState error={error} onRetry={vi.fn()} />);

      expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
    });

    it('should have aria-label on retry button', () => {
      const error = new Error('Request failed with status code 500');
      (error as any).response = { status: 500 };

      render(<ErrorState error={error} onRetry={vi.fn()} />);

      const retryButton = screen.getByLabelText('Retry loading data');
      expect(retryButton).toHaveAttribute('aria-label');
    });

    it('should have aria-hidden on icons', () => {
      const error = new Error('Something failed');
      const { container } = render(<ErrorState error={error} onRetry={vi.fn()} />);

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});

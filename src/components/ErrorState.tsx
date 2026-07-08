/**
 * ErrorState Component
 * Displays error messages with retry button and specific messaging for different error types
 * 
 * Requirements: 21.2, 21.3, 21.4, 24.3
 * - Displays user-friendly error messages
 * - Shows specific error messages for 404, 403, 500, network errors
 * - Shows permission denied for unauthorized access
 * - Provides retry button for recoverable errors
 */

import React from 'react';
import { parseError, getErrorTitle, isRetryable, getRetryText, type ParsedError } from '../utils/errorHandler';

export interface ErrorStateProps {
  /**
   * Error message or error object to display
   */
  error: string | Error | unknown;
  
  /**
   * Callback when user clicks retry button
   */
  onRetry: () => void;
  
  /**
   * Optional title to override auto-generated title
   */
  title?: string;
  
  /**
   * Optional description to show below main message
   */
  description?: string;
  
  /**
   * Whether the retry button is loading/disabled
   */
  isRetrying?: boolean;
  
  /**
   * Optional CSS class for container
   */
  className?: string;
  
  /**
   * Whether to show as a full page error or inline error
   * Defaults to 'inline' - use 'page' for full page display
   */
  variant?: 'inline' | 'page';
}

/**
 * ErrorState Component - Displays error with retry capability
 * 
 * Supports specific error types:
 * - 404 Not Found: suggests checking URL
 * - 403 Permission Denied: explains access restriction
 * - 500+ Server Error: suggests trying again later
 * - Network Error: suggests checking connection
 * 
 * @example
 * // Inline error display
 * <ErrorState 
 *   error={error}
 *   onRetry={() => refetch()}
 *   title="Failed to load data"
 * />
 * 
 * @example
 * // Full page error display
 * <ErrorState 
 *   error={error}
 *   onRetry={() => navigate('/coaches')}
 *   variant="page"
 * />
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  title,
  description,
  isRetrying = false,
  className = '',
  variant = 'inline',
}) => {
  // Parse error to get structured information
  const parsedError = parseError(error) as ParsedError;
  const errorTitle = title || getErrorTitle(parsedError);
  const showRetry = isRetryable(parsedError);
  const retryText = getRetryText(parsedError);

  // Full page variant
  if (variant === 'page') {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 ${className}`}>
        <div className="text-center max-w-md">
          {/* Error Icon */}
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <svg
                className="w-16 h-16 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4v2m0 0v2m0 0V19"
                />
                <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
              </svg>
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{errorTitle}</h1>

          {/* Error Message */}
          <p className="text-gray-700 mb-4">{parsedError.message}</p>

          {/* Description if provided */}
          {description && <p className="text-gray-600 text-sm mb-6">{description}</p>}

          {/* Retry suggestion */}
          <p className="text-gray-600 text-sm mb-6">{retryText}</p>

          {/* Retry Button */}
          {showRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              aria-label="Retry loading data"
            >
              {isRetrying ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retrying...
                </span>
              ) : (
                'Try Again'
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Inline variant (default)
  return (
    <div
      role="alert"
      className={`border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 ${className}`}
    >
      <div className="flex gap-3">
        {/* Error Icon */}
        <svg
          className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        {/* Error Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-red-900 dark:text-red-300">{errorTitle}</h4>
          <p className="text-red-800 dark:text-red-200 text-sm mt-1">{parsedError.message}</p>

          {/* Description if provided */}
          {description && <p className="text-red-700 dark:text-red-300 text-sm mt-2">{description}</p>}

          {/* Retry suggestion */}
          <p className="text-red-700 dark:text-red-300 text-xs mt-2">{retryText}</p>

          {/* Retry Button */}
          {showRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="mt-3 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label="Retry loading data"
            >
              {isRetrying ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retrying...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retry
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;

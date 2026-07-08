/**
 * Error Handler Utilities
 * Provides functions to parse and format error messages based on error type and HTTP status codes
 * Supports: 404, 403, 500, network errors, and generic errors
 * 
 * Requirements: 21.2, 21.3, 24.3
 */

export interface ParsedError {
  statusCode: number | null;
  message: string;
  isPermissionError: boolean;
  isNotFoundError: boolean;
  isNetworkError: boolean;
  isServerError: boolean;
}

/**
 * Parse error from various error types and return structured error information
 * 
 * @param error - Error object from API call or thrown exception
 * @returns ParsedError with specific error classification and user-friendly message
 */
export function parseError(error: unknown): ParsedError {
  let statusCode: number | null = null;
  let message = 'An unexpected error occurred. Please try again.';
  let isPermissionError = false;
  let isNotFoundError = false;
  let isNetworkError = false;
  let isServerError = false;

  if (error instanceof Error) {
    // Check for HTTP status codes in error message
    if (error.message.includes('403') || (error as any).response?.status === 403) {
      statusCode = 403;
      isPermissionError = true;
      message = 'You do not have permission to access this resource.';
    } else if (error.message.includes('404') || (error as any).response?.status === 404) {
      statusCode = 404;
      isNotFoundError = true;
      message = 'The requested resource was not found. Please check the URL or contact support.';
    } else if ((error as any).response?.status && (error as any).response.status >= 500) {
      statusCode = (error as any).response.status;
      isServerError = true;
      message = 'Server error. Please try again later.';
    } else if (error.message.includes('Network') || (error as any).code === 'ECONNABORTED' || (error as any).code === 'ENOTFOUND') {
      isNetworkError = true;
      message = 'Network error. Please check your connection and try again.';
    } else if ((error as any).response?.status) {
      statusCode = (error as any).response.status;
      message = (error as any).response.data?.message || 'Failed to complete request. Please try again.';
    } else {
      message = error.message || 'Failed to complete request. Please try again.';
    }
  } else if (typeof error === 'string') {
    message = error;
  }

  return {
    statusCode,
    message,
    isPermissionError,
    isNotFoundError,
    isNetworkError,
    isServerError,
  };
}

/**
 * Get a descriptive error title based on error type
 * 
 * @param parsedError - ParsedError object from parseError()
 * @returns Error title string suitable for display
 */
export function getErrorTitle(parsedError: ParsedError): string {
  if (parsedError.isPermissionError) {
    return 'Access Denied';
  }
  if (parsedError.isNotFoundError) {
    return 'Not Found';
  }
  if (parsedError.isNetworkError) {
    return 'Network Error';
  }
  if (parsedError.isServerError) {
    return 'Server Error';
  }
  return 'Error';
}

/**
 * Determine if error is recoverable with a retry button
 * 
 * @param parsedError - ParsedError object from parseError()
 * @returns true if retry button should be shown
 */
export function isRetryable(parsedError: ParsedError): boolean {
  // Permission errors and not found errors are not retryable
  if (parsedError.isPermissionError || parsedError.isNotFoundError) {
    return false;
  }
  // Network and server errors are retryable
  return true;
}

/**
 * Get retry suggestion text based on error type
 * 
 * @param parsedError - ParsedError object from parseError()
 * @returns Suggestion text for user
 */
export function getRetryText(parsedError: ParsedError): string {
  if (parsedError.isNetworkError) {
    return 'Try refreshing the page or check your internet connection.';
  }
  if (parsedError.isServerError) {
    return 'The server is temporarily unavailable. Please try again in a few moments.';
  }
  return 'Please try again. If the problem persists, contact support.';
}

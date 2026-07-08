/**
 * Tests for errorHandler utilities
 * Tests parsing and formatting errors for different HTTP status codes and error types
 * 
 * Requirements: 21.2, 21.3, 24.3
 */

import { describe, it, expect } from 'vitest';
import {
  parseError,
  getErrorTitle,
  isRetryable,
  getRetryText,
  type ParsedError,
} from './errorHandler';

describe('errorHandler', () => {
  describe('parseError', () => {
    it('should parse 404 not found errors', () => {
      const error = new Error('Request failed with status code 404');
      (error as any).response = { status: 404 };

      const result = parseError(error);

      expect(result.statusCode).toBe(404);
      expect(result.isNotFoundError).toBe(true);
      expect(result.isPermissionError).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should parse 403 permission denied errors', () => {
      const error = new Error('Request failed with status code 403');
      (error as any).response = { status: 403 };

      const result = parseError(error);

      expect(result.statusCode).toBe(403);
      expect(result.isPermissionError).toBe(true);
      expect(result.isNotFoundError).toBe(false);
      expect(result.message).toContain('permission');
    });

    it('should parse 500+ server errors', () => {
      const error = new Error('Request failed with status code 500');
      (error as any).response = { status: 500 };

      const result = parseError(error);

      expect(result.statusCode).toBe(500);
      expect(result.isServerError).toBe(true);
      expect(result.message).toContain('Server error');
    });

    it('should parse network errors', () => {
      const error = new Error('Network Error');
      (error as any).code = 'ECONNABORTED';

      const result = parseError(error);

      expect(result.isNetworkError).toBe(true);
      expect(result.message).toContain('Network error');
    });

    it('should handle string errors', () => {
      const result = parseError('Custom error message');

      expect(result.message).toBe('Custom error message');
      expect(result.isPermissionError).toBe(false);
      expect(result.isNetworkError).toBe(false);
    });

    it('should handle non-Error objects', () => {
      const result = parseError({ error: 'unknown' });

      expect(result.message).toContain('unexpected error');
      expect(result.statusCode).toBeNull();
    });
  });

  describe('getErrorTitle', () => {
    it('should return "Access Denied" for permission errors', () => {
      const error: ParsedError = {
        statusCode: 403,
        message: 'Forbidden',
        isPermissionError: true,
        isNotFoundError: false,
        isNetworkError: false,
        isServerError: false,
      };

      expect(getErrorTitle(error)).toBe('Access Denied');
    });

    it('should return "Not Found" for not found errors', () => {
      const error: ParsedError = {
        statusCode: 404,
        message: 'Not Found',
        isPermissionError: false,
        isNotFoundError: true,
        isNetworkError: false,
        isServerError: false,
      };

      expect(getErrorTitle(error)).toBe('Not Found');
    });

    it('should return "Network Error" for network errors', () => {
      const error: ParsedError = {
        statusCode: null,
        message: 'Network Error',
        isPermissionError: false,
        isNotFoundError: false,
        isNetworkError: true,
        isServerError: false,
      };

      expect(getErrorTitle(error)).toBe('Network Error');
    });

    it('should return "Server Error" for server errors', () => {
      const error: ParsedError = {
        statusCode: 500,
        message: 'Internal Server Error',
        isPermissionError: false,
        isNotFoundError: false,
        isNetworkError: false,
        isServerError: true,
      };

      expect(getErrorTitle(error)).toBe('Server Error');
    });

    it('should return "Error" for generic errors', () => {
      const error: ParsedError = {
        statusCode: null,
        message: 'Something went wrong',
        isPermissionError: false,
        isNotFoundError: false,
        isNetworkError: false,
        isServerError: false,
      };

      expect(getErrorTitle(error)).toBe('Error');
    });
  });

  describe('isRetryable', () => {
    it('should return false for permission errors', () => {
      const error: ParsedError = {
        statusCode: 403,
        message: 'Forbidden',
        isPermissionError: true,
        isNotFoundError: false,
        isNetworkError: false,
        isServerError: false,
      };

      expect(isRetryable(error)).toBe(false);
    });

    it('should return false for not found errors', () => {
      const error: ParsedError = {
        statusCode: 404,
        message: 'Not Found',
        isPermissionError: false,
        isNotFoundError: true,
        isNetworkError: false,
        isServerError: false,
      };

      expect(isRetryable(error)).toBe(false);
    });

    it('should return true for network errors', () => {
      const error: ParsedError = {
        statusCode: null,
        message: 'Network Error',
        isPermissionError: false,
        isNotFoundError: false,
        isNetworkError: true,
        isServerError: false,
      };

      expect(isRetryable(error)).toBe(true);
    });

    it('should return true for server errors', () => {
      const error: ParsedError = {
        statusCode: 500,
        message: 'Internal Server Error',
        isPermissionError: false,
        isNotFoundError: false,
        isNetworkError: false,
        isServerError: true,
      };

      expect(isRetryable(error)).toBe(true);
    });
  });

  describe('getRetryText', () => {
    it('should return network suggestion for network errors', () => {
      const error: ParsedError = {
        statusCode: null,
        message: 'Network Error',
        isPermissionError: false,
        isNotFoundError: false,
        isNetworkError: true,
        isServerError: false,
      };

      const text = getRetryText(error);
      expect(text).toContain('connection');
    });

    it('should return server suggestion for server errors', () => {
      const error: ParsedError = {
        statusCode: 500,
        message: 'Internal Server Error',
        isPermissionError: false,
        isNotFoundError: false,
        isNetworkError: false,
        isServerError: true,
      };

      const text = getRetryText(error);
      expect(text).toContain('temporarily unavailable');
    });

    it('should return generic suggestion for other errors', () => {
      const error: ParsedError = {
        statusCode: null,
        message: 'Something went wrong',
        isPermissionError: false,
        isNotFoundError: false,
        isNetworkError: false,
        isServerError: false,
      };

      const text = getRetryText(error);
      expect(text).toBeTruthy();
      expect(text.length).toBeGreaterThan(0);
    });
  });
});

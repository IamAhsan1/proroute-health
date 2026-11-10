import { describe, it, expect } from 'vitest';
import { extractApiError } from '../lib/apiError';

describe('extractApiError utility', () => {
  it('extracts error message and requestId from axios error response', () => {
    const mockAxiosError = {
      isAxiosError: true,
      message: 'Request failed with status code 500',
      response: {
        status: 500,
        data: {
          success: false,
          statusCode: 500,
          error: 'Internal Server Error',
          code: 'DATABASE_TIMEOUT',
          message: 'Could not connect to database pool',
          requestId: 'c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd',
        },
        headers: {},
      },
    };

    const parsed = extractApiError(mockAxiosError);
    expect(parsed.message).toBe('Could not connect to database pool');
    expect(parsed.statusCode).toBe(500);
    expect(parsed.code).toBe('DATABASE_TIMEOUT');
    expect(parsed.requestId).toBe('c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd');
  });

  it('falls back to x-request-id response header if not in data payload', () => {
    const mockAxiosError = {
      isAxiosError: true,
      message: 'Gateway Timeout',
      response: {
        status: 504,
        data: {
          error: 'Gateway Timeout',
        },
        headers: {
          'x-request-id': 'header-req-id-12345',
        },
      },
    };

    const parsed = extractApiError(mockAxiosError);
    expect(parsed.message).toBe('Gateway Timeout');
    expect(parsed.requestId).toBe('header-req-id-12345');
  });

  it('handles standard Javascript Error gracefully', () => {
    const standardError = new Error('Network failure');
    const parsed = extractApiError(standardError);
    expect(parsed.message).toBe('Network failure');
    expect(parsed.requestId).toBeUndefined();
  });

  it('handles unknown error types with custom fallback message', () => {
    const parsed = extractApiError(null, 'Custom fallback error');
    expect(parsed.message).toBe('Custom fallback error');
  });
});


import { AxiosError } from 'axios';

export interface ApiErrorPayload {
  message: string;
  statusCode?: number;
  code?: string;
  requestId?: string;
}

/**
 * Extracts normalized error details and correlation requestId from any API error.
 */
export function extractApiError(
  err: unknown,
  fallbackMessage = 'An unexpected error occurred'
): ApiErrorPayload {
  if (err && typeof err === 'object' && 'isAxiosError' in err) {
    const axiosErr = err as AxiosError<{
      message?: string;
      error?: string;
      code?: string;
      requestId?: string;
    }>;

    const data = axiosErr.response?.data;
    const headerReqId = axiosErr.response?.headers?.['x-request-id'] as string | undefined;

    return {
      message: data?.message || data?.error || axiosErr.message || fallbackMessage,
      statusCode: axiosErr.response?.status,
      code: data?.code,
      requestId: data?.requestId || headerReqId,
    };
  }

  if (err instanceof Error) {
    return {
      message: err.message || fallbackMessage,
    };
  }

  return {
    message: fallbackMessage,
  };
}


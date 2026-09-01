/**
 * Response Utilities
 * Helpers for creating standardized API responses
 */

import { NextResponse } from 'next/server';

/**
 * Cache duration constants (in seconds)
 */
export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute - for frequently changing data
  MEDIUM: 300, // 5 minutes - for dashboard data
  LONG: 900, // 15 minutes - for standings/analytics
  STALE: 60, // Stale-while-revalidate duration
} as const;

export type CacheDuration = (typeof CACHE_DURATIONS)[keyof typeof CACHE_DURATIONS];

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
} as const;

interface CachedResponseOptions {
  maxAge?: number;
  stale?: number;
  status?: number;
}

/**
 * Creates a JSON response with caching headers
 */
export function cachedResponse<T>(data: T, options: CachedResponseOptions = {}): NextResponse {
  const { maxAge = CACHE_DURATIONS.MEDIUM, stale = CACHE_DURATIONS.STALE, status = 200 } = options;

  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${stale}`,
    },
  });
}

/**
 * Creates a successful cached JSON response
 */
export function successResponse(
  data: unknown,
  maxAge: number = CACHE_DURATIONS.MEDIUM
): NextResponse {
  return cachedResponse<ApiSuccessResponse<unknown>>({ success: true, data }, { maxAge });
}

/**
 * Creates a private response for authenticated or mutation data.
 */
export function privateJsonResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status, headers: PRIVATE_NO_STORE_HEADERS });
}

/**
 * Creates an allowlisted mutation success envelope that cannot be cached.
 */
export function mutationSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  return privateJsonResponse<ApiSuccessResponse<T>>({ success: true, data }, status);
}

/**
 * Creates an error response (no caching)
 */
export function errorResponse(message: string, status: number = 500): NextResponse {
  return privateJsonResponse<ApiErrorResponse>({ success: false, error: message }, status);
}

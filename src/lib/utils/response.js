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
};

/**
 * Creates a JSON response with caching headers
 * @param {object} data - Response data
 * @param {object} options - Options
 * @param {number} options.maxAge - Cache max-age in seconds (default: MEDIUM)
 * @param {number} options.stale - Stale-while-revalidate duration (default: 60)
 * @param {number} options.status - HTTP status code (default: 200)
 * @returns {NextResponse}
 */
export function cachedResponse(data, options = {}) {
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
 * @param {any} data - Response data payload
 * @param {number} maxAge - Cache duration (default: 300s)
 * @returns {NextResponse}
 */
export function successResponse(data, maxAge = CACHE_DURATIONS.MEDIUM) {
  return cachedResponse({ success: true, data }, { maxAge });
}

/**
 * Creates an error response (no caching)
 * @param {string} message - Error message
 * @param {number} status - HTTP status (default: 500)
 * @returns {NextResponse}
 */
export function errorResponse(message, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Market API Route
 *
 * Endpoint: GET /api/market
 * Returns: Market statistics and recent transfers
 */

import { getMarketPageData } from '@/lib/services';
import { validateNumber } from '@/lib/utils/validation';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

/**
 * GET /api/market
 *
 * Query params:
 * - limit: number of transfers to return (default: 50, max: 500)
 *
 * Returns JSON with:
 * - kpis: Market statistics (total, avg, max, min)
 * - transfers: Recent transfers
 * - trends: Market trends over time
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitValidation = validateNumber(searchParams.get('limit'), {
      defaultValue: 50,
      min: 1,
      max: 500,
    });

    if (!limitValidation.valid) {
      return errorResponse(limitValidation.error, 400);
    }

    const data = await getMarketPageData();

    return successResponse(data, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse('Failed to fetch market data');
  }
}

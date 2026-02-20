/**
 * Market API Route
 * Endpoint: GET /api/market
 */

import { NextRequest } from 'next/server';
import { getMarketPageData } from '@/lib/services';
import { validateNumber } from '@/lib/utils/validation';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
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

import { NextRequest } from 'next/server';
import { fetchMarketTrendsAnalysis } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';
import { validateNumber } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysValidation = validateNumber(searchParams.get('days'), {
      defaultValue: 30,
      min: 1,
      max: 365,
    });

    if (!daysValidation.valid) {
      return errorResponse(daysValidation.error, 400);
    }

    const days = daysValidation.value;

    const allowedDays = [7, 30, 90, 180, 365];
    if (!allowedDays.includes(days)) {
      return errorResponse('Invalid days parameter', 400);
    }

    const data = await fetchMarketTrendsAnalysis(days);
    return successResponse(data, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching market trends:', error);
    return errorResponse('Failed to fetch market trends');
  }
}

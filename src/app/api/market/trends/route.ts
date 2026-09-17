import { NextRequest } from 'next/server';
import { getMarketTrendsAnalysis, parseMarketTrendDays } from '@/features/market/server';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysValidation = parseMarketTrendDays(searchParams.get('days'));

    if (!daysValidation.valid) {
      return errorResponse(daysValidation.error, 400);
    }

    const days = daysValidation.value;

    const data = await getMarketTrendsAnalysis(days);
    return successResponse(data, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching market trends:', error);
    return errorResponse('Failed to fetch market trends');
  }
}

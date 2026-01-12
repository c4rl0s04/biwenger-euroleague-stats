import { fetchVolatilityStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const volatility = await fetchVolatilityStats();
    return successResponse(volatility, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching volatility:', error);
    return errorResponse('Internal Server Error');
  }
}

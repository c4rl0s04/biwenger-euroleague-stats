import { fetchMarketOpportunities } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = fetchMarketOpportunities(6);
    return successResponse(data, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching market opportunities:', error);
    return errorResponse('Failed to fetch market opportunities');
  }
}

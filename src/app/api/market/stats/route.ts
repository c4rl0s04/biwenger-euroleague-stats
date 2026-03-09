import { fetchMarketStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await fetchMarketStats();
    return successResponse(stats, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching market stats:', error);
    return errorResponse('Failed to fetch market stats');
  }
}

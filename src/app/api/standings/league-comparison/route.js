import { fetchLeagueComparisonStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const comparison = getLeagueComparisonStats();
    return successResponse(comparison, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching league comparison:', error);
    return errorResponse('Internal Server Error');
  }
}

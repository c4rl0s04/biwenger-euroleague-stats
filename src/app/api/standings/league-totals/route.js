import { getLeagueOverview } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leagueTotals = await getLeagueOverview();

    // Cache for 1 hour (3600s) as these stats don't change often
    return successResponse(leagueTotals, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching league totals:', error);
    return errorResponse('Internal Server Error');
  }
}

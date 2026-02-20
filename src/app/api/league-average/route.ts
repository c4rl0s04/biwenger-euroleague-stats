import { fetchLeagueAveragePoints } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/league-average
 * Returns the league average points per round
 */
export async function GET() {
  try {
    const average = await fetchLeagueAveragePoints();
    return successResponse({ average }, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching league average:', error);
    return errorResponse('Internal Server Error');
  }
}

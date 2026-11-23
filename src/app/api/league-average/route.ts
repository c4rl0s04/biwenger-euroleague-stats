import { fetchLeagueAveragePoints } from '@/features/dashboard/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/league-average
 * Returns the league average points per round
 */
export async function GET() {
  try {
    const average = await fetchLeagueAveragePoints();
    return privateJsonResponse({ success: true, data: { average } });
  } catch (error) {
    console.error('Error fetching league average:', error);
    return errorResponse('Internal Server Error');
  }
}

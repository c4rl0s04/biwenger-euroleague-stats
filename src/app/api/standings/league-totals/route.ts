import { getLeagueOverview, STANDINGS_CACHE_POLICY } from '@/features/standings/server';
import { successResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leagueTotals = await getLeagueOverview();

    return successResponse(leagueTotals, STANDINGS_CACHE_POLICY.overviewHttpSeconds);
  } catch (error) {
    console.error('Error fetching league totals:', error);
    return errorResponse('Internal Server Error');
  }
}

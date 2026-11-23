import { getLeagueOverview } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leagueTotals = await getLeagueOverview();

    return privateJsonResponse({ success: true, data: leagueTotals });
  } catch (error) {
    console.error('Error fetching league totals:', error);
    return errorResponse('Internal Server Error');
  }
}

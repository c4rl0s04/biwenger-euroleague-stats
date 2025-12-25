import { getLeagueOverview } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totals = getLeagueOverview();
    return successResponse(totals, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching league totals:', error);
    return errorResponse('Internal Server Error');
  }
}

import { getFullStandings } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const standings = await getFullStandings();
    return successResponse(standings, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching standings:', error);
    return errorResponse('Internal Server Error');
  }
}

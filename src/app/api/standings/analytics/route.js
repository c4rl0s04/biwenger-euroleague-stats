import { getInitialSquadActualPerformance } from '@/lib/db';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const analytics = getInitialSquadActualPerformance();
    return successResponse(analytics, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return errorResponse('Internal Server Error');
  }
}

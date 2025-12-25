import { fetchStreakStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const streaks = fetchStreakStats();
    return successResponse(streaks, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching streaks:', error);
    return errorResponse('Internal Server Error');
  }
}

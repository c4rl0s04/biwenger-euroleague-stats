import { fetchPlayerStreaks } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const streaks = await fetchPlayerStreaks();
    return successResponse(streaks, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching player streaks:', error);
    return errorResponse('Failed to fetch player streaks');
  }
}

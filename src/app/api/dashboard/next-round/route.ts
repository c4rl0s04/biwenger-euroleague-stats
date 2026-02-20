import { fetchNextRound } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const nextRound = await fetchNextRound();
    return successResponse({ nextRound }, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching next round data:', error);
    return errorResponse('Failed to fetch next round data');
  }
}

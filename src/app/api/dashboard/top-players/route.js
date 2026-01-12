import { fetchTopPlayers } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const topPlayers = await fetchTopPlayers();
    return successResponse(topPlayers, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching top players:', error);
    return errorResponse('Failed to fetch top players');
  }
}

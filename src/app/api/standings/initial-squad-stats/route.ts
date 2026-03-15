import { fetchInitialSquadStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await fetchInitialSquadStats();
    return successResponse(stats, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching initial squad stats:', error);
    return errorResponse('Internal Server Error');
  }
}

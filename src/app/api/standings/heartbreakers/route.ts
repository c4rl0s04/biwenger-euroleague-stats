import { fetchHeartbreakerStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const heartbreakers = await fetchHeartbreakerStats();
    return successResponse(heartbreakers, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching heartbreaker stats:', error);
    return errorResponse('Internal Server Error');
  }
}

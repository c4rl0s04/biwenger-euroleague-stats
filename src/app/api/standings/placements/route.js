import { fetchPlacementStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const placements = await fetchPlacementStats();
    return successResponse(placements, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching placements:', error);
    return errorResponse('Internal Server Error');
  }
}

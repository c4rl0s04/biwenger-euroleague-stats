import { fetchRisingStars } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stars = getRisingStars(5);
    return successResponse(stars, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching rising stars:', error);
    return errorResponse('Failed to fetch rising stars');
  }
}

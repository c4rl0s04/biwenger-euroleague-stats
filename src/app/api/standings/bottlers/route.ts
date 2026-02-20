import { fetchBottlerStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const bottlers = await fetchBottlerStats();
    return successResponse(bottlers, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching bottler stats:', error);
    return errorResponse('Internal Server Error');
  }
}

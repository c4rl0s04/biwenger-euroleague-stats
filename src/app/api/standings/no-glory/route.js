import { fetchNoGloryStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const noGlory = fetchNoGloryStats();
    return successResponse(noGlory, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching no glory stats:', error);
    return errorResponse('Internal Server Error');
  }
}

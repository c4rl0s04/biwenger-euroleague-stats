import { fetchEfficiencyStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const efficiency = await fetchEfficiencyStats();
    return successResponse(efficiency, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching efficiency stats:', error);
    return errorResponse('Internal Server Error');
  }
}

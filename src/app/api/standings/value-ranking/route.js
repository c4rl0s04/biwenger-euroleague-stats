import { fetchValueRanking } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const valueRanking = fetchValueRanking();
    return successResponse(valueRanking, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching value ranking:', error);
    return errorResponse('Internal Server Error');
  }
}

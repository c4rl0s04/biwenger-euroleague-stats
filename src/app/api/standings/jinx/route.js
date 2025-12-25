import { fetchJinxStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const jinx = fetchJinxStats();
    return successResponse(jinx, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching jinx stats:', error);
    return errorResponse('Internal Server Error');
  }
}

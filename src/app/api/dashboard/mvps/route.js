import { fetchLastRoundMVPs } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const mvps = fetchLastRoundMVPs();
    return successResponse(mvps, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching last round MVPs:', error);
    return errorResponse('Failed to fetch MVPs');
  }
}

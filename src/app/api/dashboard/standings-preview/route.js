import { fetchStandingsPreview } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/standings-with-winner
 * Combined endpoint returning both standings and last round winner
 * Optimized for StandingsCard component
 */
export async function GET() {
  try {
    const data = fetchStandingsPreview();
    return successResponse(data, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching standings with winner:', error);
    return errorResponse('Internal Server Error');
  }
}

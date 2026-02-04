import { fetchRoundCompleteData, fetchUserRoundDetails } from '@/lib/services'; // Import aggregator
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId');
    const userId = searchParams.get('userId');
    const mode = searchParams.get('mode'); // Check for mode=full

    if (!roundId) return errorResponse('Missing roundId');

    // NEW: Full Mode (One-Shot Fetch for Rounds Page)
    if (mode === 'full') {
      const fullData = await fetchRoundCompleteData(roundId);
      return successResponse(fullData, CACHE_DURATIONS.MEDIUM);
    }

    // LEGACY: Specific User fetch (Keep for now or if light fetch needed)
    // LEGACY: Specific User fetch
    const data = await fetchUserRoundDetails(roundId, userId);

    return successResponse(data, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching round stats:', error);
    return errorResponse('Failed to fetch round stats');
  }
}

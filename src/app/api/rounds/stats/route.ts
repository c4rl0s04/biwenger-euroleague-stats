import { NextRequest } from 'next/server';
import { fetchRoundCompleteData, fetchUserRoundDetails } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId');
    const userId = searchParams.get('userId') ?? undefined;
    const mode = searchParams.get('mode');

    if (!roundId) return errorResponse('Missing roundId');

    // Quick mode: Only fetch the selected user's detailed data
    if (mode === 'quick') {
      if (!userId) return errorResponse('Missing userId for quick mode');
      try {
        const quickData = await fetchRoundCompleteData(roundId, userId);
        return successResponse(quickData, CACHE_DURATIONS.MEDIUM);
      } catch (quickError) {
        console.error('Error in quick mode:', quickError);
        throw quickError;
      }
    }

    // Full mode: Fetch all users' detailed data (background load)
    if (mode === 'full') {
      try {
        const fullData = await fetchRoundCompleteData(roundId);
        return successResponse(fullData, CACHE_DURATIONS.MEDIUM);
      } catch (fullError) {
        console.error('Error in full mode:', fullError);
        throw fullError;
      }
    }

    // Default mode: Fetch user-specific details (legacy)
    const data = await fetchUserRoundDetails(roundId, userId);
    return successResponse(data, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching round stats:', error);
    return errorResponse(
      `Failed to fetch round stats: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

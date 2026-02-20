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

    if (mode === 'full') {
      const fullData = await fetchRoundCompleteData(roundId);
      return successResponse(fullData, CACHE_DURATIONS.MEDIUM);
    }

    const data = await fetchUserRoundDetails(roundId, userId);
    return successResponse(data, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching round stats:', error);
    return errorResponse('Failed to fetch round stats');
  }
}

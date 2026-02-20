import { NextRequest } from 'next/server';
import { fetchRoundStandings } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId');

    if (!roundId) {
      return errorResponse('Missing roundId', 400);
    }

    const data = await fetchRoundStandings(roundId);
    return successResponse(data, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching round standings:', error);
    return errorResponse('Failed to fetch round standings');
  }
}

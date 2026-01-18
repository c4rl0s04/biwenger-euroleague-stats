import { fetchUserLineup } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const roundId = searchParams.get('roundId');

    if (!userId || !roundId) {
      return errorResponse('Missing userId or roundId', 400);
    }

    const lineup = await fetchUserLineup(userId, roundId);

    return successResponse(lineup, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching user lineup:', error);
    return errorResponse('Failed to fetch user lineup');
  }
}

import { fetchRoundWinners } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : 15;
    const winners = await fetchRoundWinners(limit);
    return successResponse(winners, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching round winners:', error);
    return errorResponse('Internal Server Error');
  }
}

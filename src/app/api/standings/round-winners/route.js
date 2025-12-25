import { fetchRoundWinners } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const winners = fetchRoundWinners();
    return successResponse(winners, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching round winners:', error);
    return errorResponse('Internal Server Error');
  }
}

import { fetchValueRanking, STANDINGS_CACHE_POLICY } from '@/features/standings/server';
import { successResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const valueRanking = await fetchValueRanking();
    return successResponse(valueRanking, STANDINGS_CACHE_POLICY.valueHttpSeconds);
  } catch (error) {
    console.error('Error fetching value ranking:', error);
    return errorResponse('Internal Server Error');
  }
}

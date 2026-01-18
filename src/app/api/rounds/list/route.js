import { fetchRoundsList } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchRoundsList();

    return successResponse(data, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching rounds list:', error);
    return errorResponse('Failed to fetch rounds list');
  }
}

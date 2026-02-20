import { fetchTopPlayersByForm } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchTopPlayersByForm(5, 3);
    return successResponse(data, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching top form data:', error);
    return errorResponse('Failed to fetch top form data');
  }
}

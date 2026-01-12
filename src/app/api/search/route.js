import { globalSearch } from '@/lib/db/queries/search';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return successResponse({ players: [], teams: [], users: [] }, CACHE_DURATIONS.SHORT);
    }

    const results = await globalSearch(query);
    return successResponse(results, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Search API Error:', error);
    return errorResponse('Failed to search');
  }
}

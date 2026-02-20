import { NextRequest } from 'next/server';
import { performGlobalSearch } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return successResponse({ players: [], teams: [], users: [] }, CACHE_DURATIONS.SHORT);
    }

    const results = await performGlobalSearch(query);
    return successResponse(results, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Search API Error:', error);
    return errorResponse('Failed to search');
  }
}

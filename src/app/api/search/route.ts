import { NextRequest } from 'next/server';
import { performGlobalSearch, SEARCH_HTTP_CACHE_SECONDS } from '@/features/search/server';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const results = await performGlobalSearch(query);
    return successResponse(results, SEARCH_HTTP_CACHE_SECONDS);
  } catch (error) {
    console.error('Search API Error:', error);
    return errorResponse('Failed to search');
  }
}

import { NextRequest } from 'next/server';
import { performGlobalSearch } from '@/features/search/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const results = await performGlobalSearch(query);
    return privateJsonResponse({ success: true, data: results });
  } catch (error) {
    console.error('Search API Error:', error);
    return errorResponse('Failed to search');
  }
}

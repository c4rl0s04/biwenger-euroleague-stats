import { NextRequest } from 'next/server';
import { fetchDetailedCaptainStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const stats = await fetchDetailedCaptainStats();
    return successResponse({ stats }, CACHE_DURATIONS.NONE);
  } catch (error) {
    console.error('API Error in /api/standings/captains:', error);
    return errorResponse('Failed to fetch detailed captain stats');
  }
}

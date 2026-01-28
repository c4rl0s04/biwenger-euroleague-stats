import { NextResponse } from 'next/server';
import { getUserPerformanceHistoryService } from '@/lib/services/roundsService';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * GET /api/rounds/history?userId=X
 * Returns user's performance history across all finished rounds
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return errorResponse('userId is required', 400);
    }

    const history = await getUserPerformanceHistoryService(userId);

    // Return encapsulated data object typical for useApiData
    // Cache set to 0 to ensure non-participating rounds updates are seen immediately
    return successResponse({ history }, 0);
  } catch (error) {
    console.error('Error fetching performance history:', error);
    return errorResponse('Failed to fetch history');
  }
}

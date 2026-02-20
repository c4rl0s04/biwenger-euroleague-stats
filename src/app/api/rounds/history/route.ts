import { NextRequest } from 'next/server';
import { getUserPerformanceHistoryService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return errorResponse('userId is required', 400);
    }

    const history = await getUserPerformanceHistoryService(userId);
    return successResponse({ history }, 0);
  } catch (error) {
    console.error('Error fetching performance history:', error);
    return errorResponse('Failed to fetch history');
  }
}

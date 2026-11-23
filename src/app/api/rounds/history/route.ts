import { NextRequest } from 'next/server';
import { readRoundHttpInput } from '@/features/rounds/server';
import { getUserPerformanceHistoryService } from '@/features/rounds/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { userId } = readRoundHttpInput(searchParams);

    if (!userId) {
      return errorResponse('userId is required', 400);
    }

    const history = await getUserPerformanceHistoryService(userId);
    return privateJsonResponse({ success: true, data: { history } });
  } catch (error) {
    console.error('Error fetching performance history:', error);
    return errorResponse('Failed to fetch history');
  }
}

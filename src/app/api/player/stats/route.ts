import { NextRequest } from 'next/server';
import { fetchUserSeasonStats } from '@/lib/services';
import { CACHE_DURATIONS, successResponse, errorResponse } from '@/lib/utils/response';
import { validateUserId } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdValidation = validateUserId(searchParams.get('userId'));

    if (!userIdValidation.valid) {
      return errorResponse(userIdValidation.error, 400);
    }

    const stats = await fetchUserSeasonStats(userIdValidation.value);
    return successResponse({ stats }, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching player season stats:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return errorResponse(message, 500);
  }
}

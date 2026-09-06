import { NextRequest } from 'next/server';
import { fetchUserSeasonStats } from '@/lib/services';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';
import { getRequestUserId } from '@/lib/utils/api-auth';

export async function GET(request: NextRequest) {
  try {
    const userIdValidation = await getRequestUserId(request);

    if (userIdValidation.valid === false) {
      return errorResponse(userIdValidation.error, 400);
    }

    const stats = await fetchUserSeasonStats(userIdValidation.value);
    return privateJsonResponse({ success: true, data: { stats } });
  } catch (error) {
    console.error('Error fetching player season stats:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return errorResponse(message, 500);
  }
}

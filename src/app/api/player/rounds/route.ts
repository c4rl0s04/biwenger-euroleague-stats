import { NextRequest } from 'next/server';
import { getPlayerUserRoundsData } from '@/features/players/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';
import { getRequestUserId } from '@/lib/utils/api-auth';

export async function GET(request: NextRequest) {
  try {
    const userIdValidation = await getRequestUserId(request);

    if (userIdValidation.valid === false) {
      return errorResponse(userIdValidation.error, 400);
    }

    const data = await getPlayerUserRoundsData(userIdValidation.value);
    return privateJsonResponse({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse('Failed to fetch rounds');
  }
}

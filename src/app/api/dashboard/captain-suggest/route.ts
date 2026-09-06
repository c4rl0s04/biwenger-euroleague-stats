import { NextRequest } from 'next/server';
import { fetchCaptainRecommendations } from '@/lib/services';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';
import { getRequestUserId } from '@/lib/utils/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userIdValidation = await getRequestUserId(request);

    if (userIdValidation.valid === false) {
      return errorResponse(userIdValidation.error, 400);
    }

    const data = await fetchCaptainRecommendations(userIdValidation.value, 6);
    return privateJsonResponse({ success: true, data });
  } catch (error) {
    console.error('Error fetching captain suggestions:', error);
    return errorResponse('Failed to fetch captain suggestions');
  }
}

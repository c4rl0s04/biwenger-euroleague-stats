import { NextRequest } from 'next/server';
import { fetchCaptainRecommendations } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';
import { getRequestUserId } from '@/lib/utils/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userIdValidation = await getRequestUserId(request);

    if (!userIdValidation.valid) {
      return errorResponse(userIdValidation.error, 400);
    }

    const data = await fetchCaptainRecommendations(userIdValidation.value, 6);
    return successResponse(data, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching captain suggestions:', error);
    return errorResponse('Failed to fetch captain suggestions');
  }
}

import { NextRequest } from 'next/server';
import { fetchCaptainStats } from '@/lib/services';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';
import { getRequestUserId } from '@/lib/utils/api-auth';

export async function GET(request: NextRequest) {
  try {
    const userIdValidation = await getRequestUserId(request);

    if (userIdValidation.valid === false) {
      return errorResponse(userIdValidation.error, 400);
    }

    const stats = await fetchCaptainStats(userIdValidation.value);
    return privateJsonResponse({ success: true, data: { stats } });
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse('Failed to fetch captain stats');
  }
}

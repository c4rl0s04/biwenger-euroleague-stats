import { fetchCaptainStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';
import { validateUserId } from '@/lib/utils/validation';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdValidation = validateUserId(searchParams.get('userId'));

    if (!userIdValidation.valid) {
      return errorResponse(userIdValidation.error, 400);
    }

    const stats = await fetchCaptainStats(userIdValidation.value);
    return successResponse({ stats }, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse('Failed to fetch captain stats');
  }
}

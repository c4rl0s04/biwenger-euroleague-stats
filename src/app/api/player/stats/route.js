import { fetchUserSeasonStats } from '@/lib/services';
import { CACHE_DURATIONS } from '@/lib/utils/response';
import { validateUserId } from '@/lib/utils/validation';
import { withApiHandler } from '@/lib/utils/api-wrapper';

export const GET = withApiHandler(
  async (request) => {
    const { searchParams } = new URL(request.url);
    const userIdValidation = validateUserId(searchParams.get('userId'));

    if (!userIdValidation.valid) {
      // Throwing error with status -> handled by wrapper
      const error = new Error(userIdValidation.error);
      error.status = 400;
      throw error;
    }

    const stats = fetchUserSeasonStats(userIdValidation.value);
    
    // Return data for successResponse({ stats })
    // We can also pass cache duration
    return {
      data: { stats },
      cache: CACHE_DURATIONS.MEDIUM
    };
  }
);

import { fetchPlayerBirthdays } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const birthdays = fetchPlayerBirthdays();
    return successResponse(birthdays, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching birthdays:', error);
    return errorResponse('Failed to fetch birthdays');
  }
}

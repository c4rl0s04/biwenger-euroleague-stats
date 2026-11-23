import { fetchEfficiencyStats } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const efficiency = await fetchEfficiencyStats();
    return privateJsonResponse({ success: true, data: efficiency });
  } catch (error) {
    console.error('Error fetching efficiency stats:', error);
    return errorResponse('Internal Server Error');
  }
}

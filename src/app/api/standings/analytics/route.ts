import { fetchInitialSquadAnalytics } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const analytics = await fetchInitialSquadAnalytics();
    return privateJsonResponse({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return errorResponse('Internal Server Error');
  }
}

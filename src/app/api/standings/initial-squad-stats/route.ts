import { fetchInitialSquadStats } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await fetchInitialSquadStats();
    return privateJsonResponse({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching initial squad stats:', error);
    return errorResponse('Internal Server Error');
  }
}

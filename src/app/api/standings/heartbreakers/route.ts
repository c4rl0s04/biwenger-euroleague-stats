import { fetchHeartbreakerStats } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const heartbreakers = await fetchHeartbreakerStats();
    return privateJsonResponse({ success: true, data: heartbreakers });
  } catch (error) {
    console.error('Error fetching heartbreaker stats:', error);
    return errorResponse('Internal Server Error');
  }
}

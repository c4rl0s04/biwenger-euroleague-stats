import { fetchNoGloryStats } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const noGlory = await fetchNoGloryStats();
    return privateJsonResponse({ success: true, data: noGlory });
  } catch (error) {
    console.error('Error fetching no glory stats:', error);
    return errorResponse('Internal Server Error');
  }
}

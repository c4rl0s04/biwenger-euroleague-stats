import { fetchBottlerStats } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const bottlers = await fetchBottlerStats();
    return privateJsonResponse({ success: true, data: bottlers });
  } catch (error) {
    console.error('Error fetching bottler stats:', error);
    return errorResponse('Internal Server Error');
  }
}

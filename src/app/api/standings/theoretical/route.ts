import { fetchTheoreticalStandings } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchTheoreticalStandings();
    return privateJsonResponse({ success: true, data: data });
  } catch (error) {
    console.error('Error fetching theoretical standings:', error);
    return errorResponse('Internal Server Error');
  }
}

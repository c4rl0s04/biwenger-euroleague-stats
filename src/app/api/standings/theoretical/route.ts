import { fetchTheoreticalStandings } from '@/lib/services/app/standingsService';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchTheoreticalStandings();
    return successResponse(data, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching theoretical standings:', error);
    return errorResponse('Internal Server Error');
  }
}

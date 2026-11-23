import { fetchValueRanking } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const valueRanking = await fetchValueRanking();
    return privateJsonResponse({ success: true, data: valueRanking });
  } catch (error) {
    console.error('Error fetching value ranking:', error);
    return errorResponse('Internal Server Error');
  }
}

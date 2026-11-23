import { fetchMarketStats } from '@/features/market/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await fetchMarketStats();
    return privateJsonResponse({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching market stats:', error);
    return errorResponse('Failed to fetch market stats');
  }
}

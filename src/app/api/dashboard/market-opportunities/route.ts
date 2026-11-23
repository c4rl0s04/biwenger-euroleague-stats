import { fetchMarketOpportunities } from '@/features/dashboard/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchMarketOpportunities(6);
    return privateJsonResponse({ success: true, data });
  } catch (error) {
    console.error('Error fetching market opportunities:', error);
    return errorResponse('Failed to fetch market opportunities');
  }
}

import { fetchVolatilityStats } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const volatility = await fetchVolatilityStats();
    return privateJsonResponse({ success: true, data: volatility });
  } catch (error) {
    console.error('Error fetching volatility:', error);
    return errorResponse('Internal Server Error');
  }
}

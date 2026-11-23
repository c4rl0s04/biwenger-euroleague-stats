import { fetchLastRoundMVPs } from '@/features/dashboard/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const mvps = await fetchLastRoundMVPs();
    return privateJsonResponse({ success: true, data: mvps });
  } catch (error) {
    console.error('Error fetching last round MVPs:', error);
    return errorResponse('Failed to fetch MVPs');
  }
}

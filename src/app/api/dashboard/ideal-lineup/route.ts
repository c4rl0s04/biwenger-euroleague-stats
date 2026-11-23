import { getDashboardIdealLineup } from '@/features/dashboard/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getDashboardIdealLineup();
    return privateJsonResponse({ success: true, data: result.data });
  } catch (error) {
    console.error('Error fetching ideal lineup:', error);
    return errorResponse('Failed to fetch ideal lineup');
  }
}

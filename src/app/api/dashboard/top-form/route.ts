import { fetchTopPlayersByForm } from '@/features/dashboard/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchTopPlayersByForm(6, 3);
    return privateJsonResponse({ success: true, data });
  } catch (error) {
    console.error('Error fetching top form data:', error);
    return errorResponse('Failed to fetch top form data');
  }
}

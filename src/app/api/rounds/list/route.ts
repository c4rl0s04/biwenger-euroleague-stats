import { fetchRoundsList } from '@/features/rounds/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchRoundsList();

    return privateJsonResponse({ success: true, data });
  } catch (error) {
    console.error('Error fetching rounds list:', error);
    return errorResponse('Failed to fetch rounds list');
  }
}

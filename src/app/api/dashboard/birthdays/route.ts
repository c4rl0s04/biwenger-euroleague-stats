import { fetchPlayerBirthdays } from '@/features/dashboard/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const birthdays = await fetchPlayerBirthdays();
    return privateJsonResponse({ success: true, data: birthdays });
  } catch (error) {
    console.error('Error fetching birthdays:', error);
    return errorResponse('Failed to fetch birthdays');
  }
}

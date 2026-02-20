import { fetchAllUsers } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await fetchAllUsers();
    return successResponse(users, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching users:', error);
    return errorResponse('Internal Server Error');
  }
}

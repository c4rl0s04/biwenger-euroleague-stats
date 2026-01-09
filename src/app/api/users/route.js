import { getAllUsers } from '@/lib/db/queries/users';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = getAllUsers();
    return successResponse(users, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching users:', error);
    return errorResponse('Internal Server Error');
  }
}

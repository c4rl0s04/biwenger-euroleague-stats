import { getManagerDirectory } from '@/features/managers/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await getManagerDirectory();
    return privateJsonResponse({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return errorResponse('Internal Server Error');
  }
}

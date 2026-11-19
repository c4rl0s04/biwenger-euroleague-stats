import { privateJsonResponse } from '@/lib/utils/response';
import { hoopgridReadService } from '@/features/hoopgrid/server';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || undefined;

    const session = await auth();
    const userId = session?.user?.id;

    const data = await hoopgridReadService.getTodayChallenge(dateParam, userId);

    return privateJsonResponse(data);
  } catch (error: any) {
    console.error('Hoopgrid Today Error:', error);
    return privateJsonResponse({ error: error.message || 'Internal Server Error' }, 500);
  }
}

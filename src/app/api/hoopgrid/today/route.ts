import { privateJsonResponse } from '@/lib/utils/response';
import { HoopgridValidationError, hoopgridReadService } from '@/features/hoopgrid/server';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || undefined;

    const session = await auth();
    const userId = session?.user?.id;

    const data = await hoopgridReadService.getTodayChallenge(dateParam, userId);

    return privateJsonResponse(data);
  } catch (error) {
    console.error('Hoopgrid Today Error:', error);
    const message =
      error instanceof HoopgridValidationError ? error.message : 'Internal Server Error';
    return privateJsonResponse({ error: message }, 500);
  }
}

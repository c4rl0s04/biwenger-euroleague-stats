import { hoopgridCommandService, HoopgridValidationError } from '@/features/hoopgrid/server';
import { auth } from '@/auth';
import { privateJsonResponse } from '@/lib/utils/response';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return privateJsonResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await request.json();

    if (body?.action === 'submitBatch') {
      const result = await hoopgridCommandService.submitBatchGuesses(body, userId);
      return privateJsonResponse(result);
    }

    const result = await hoopgridCommandService.submitGuess(body, userId);
    return privateJsonResponse(result);
  } catch (error: any) {
    if (error instanceof HoopgridValidationError) {
      return privateJsonResponse({ error: error.message, details: error.errors }, 400);
    }
    console.error('Hoopgrid Guess Error:', error);
    return privateJsonResponse({ error: error.message || 'Internal Server Error' }, 500);
  }
}

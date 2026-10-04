import { auth } from '@/auth';
import { privateJsonResponse } from '@/lib/utils/response';
import {
  placePersonalBidNow,
  personalBidErrorResponse,
  readPersonalJson,
} from '@/features/market/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return privateJsonResponse({ message: 'No autorizado' }, 401);
  try {
    return privateJsonResponse(
      await placePersonalBidNow(session.user.id, await readPersonalJson(request))
    );
  } catch (error) {
    return personalBidErrorResponse(error);
  }
}

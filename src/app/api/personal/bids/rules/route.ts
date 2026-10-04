import { auth } from '@/auth';
import { privateJsonResponse } from '@/lib/utils/response';
import {
  schedulePersonalBid,
  personalBidErrorResponse,
  readPersonalJson,
} from '@/features/market/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return privateJsonResponse({ message: 'No autorizado' }, 401);
  try {
    return privateJsonResponse(
      { rule: await schedulePersonalBid(session.user.id, await readPersonalJson(request)) },
      201
    );
  } catch (error) {
    return personalBidErrorResponse(error);
  }
}

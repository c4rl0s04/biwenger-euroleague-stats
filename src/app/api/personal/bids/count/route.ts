import { auth } from '@/auth';
import { privateJsonResponse } from '@/lib/utils/response';
import { readPersonalBidCount, personalBidErrorResponse } from '@/features/market/server';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return privateJsonResponse({ message: 'No autorizado' }, 401);
  const raw = new URL(request.url).searchParams.get('playerId');
  const playerId = Number(raw);
  if (!raw || !Number.isSafeInteger(playerId) || playerId <= 0)
    return privateJsonResponse({ message: 'Jugador no válido.' }, 400);
  try {
    return privateJsonResponse(await readPersonalBidCount(session.user.id, playerId));
  } catch (error) {
    return personalBidErrorResponse(error);
  }
}

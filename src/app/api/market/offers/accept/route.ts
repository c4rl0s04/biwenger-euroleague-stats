import { auth } from '@/auth';
import { marketActionsService } from '@/lib/services/marketActionsService';
import { mutationSuccessResponse, errorResponse } from '@/lib/utils/response';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('No autorizado', 401);
    }

    const { offerId, playerId } = await request.json();

    if (!offerId) {
      return errorResponse('ID de oferta no proporcionado', 400);
    }

    const parsedOfferId = Number(offerId);
    const parsedPlayerId = playerId ? Number(playerId) : undefined;
    await marketActionsService.acceptOffer({
      offerId: parsedOfferId,
      userId: session.user.id,
      playerId: parsedPlayerId,
    });

    return mutationSuccessResponse({
      status: 'completed',
      offerId: parsedOfferId,
      ...(parsedPlayerId ? { playerId: parsedPlayerId } : {}),
    });
  } catch {
    console.error('Offer accept mutation failed');
    return errorResponse('Error al aceptar la oferta', 500);
  }
}

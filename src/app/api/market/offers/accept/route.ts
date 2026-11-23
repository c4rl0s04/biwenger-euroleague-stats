import { auth } from '@/auth';
import { marketCommandService, MarketCommandValidationError } from '@/features/market/server';
import { mutationSuccessResponse, errorResponse } from '@/lib/utils/response';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('No autorizado', 401);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Cuerpo de solicitud inválido', 400);
    }

    const result = await marketCommandService.acceptOffer(session.user.id as string, body);

    return mutationSuccessResponse({
      status: result.status,
      offerId: result.offerId,
      ownership: result.ownership,
      ...(result.playerId ? { playerId: result.playerId } : {}),
    });
  } catch (error) {
    if (error instanceof MarketCommandValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('[API Market Offer Accept] Mutation failed');
    return errorResponse('Error al aceptar la oferta', 500);
  }
}

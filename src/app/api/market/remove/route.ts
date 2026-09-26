import { auth } from '@/auth';
import { marketCommandService, MarketCommandValidationError } from '@/features/market/server';
import { mutationSuccessResponse, errorResponse } from '@/lib/utils/response';

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('No autorizado', 401);
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return errorResponse('ID de jugador no proporcionado', 400);
    }

    const result = await marketCommandService.withdrawPlayer(session.user.id as string, {
      playerId,
    });

    return mutationSuccessResponse({ status: result.status, playerId: result.playerId });
  } catch (error: any) {
    if (error instanceof MarketCommandValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('[API Market Remove] Mutation failed');
    const message =
      error instanceof Error &&
      !error.message.includes('token') &&
      !error.message.includes('Bearer')
        ? error.message
        : 'Error al retirar del mercado';
    return errorResponse(message, 500);
  }
}

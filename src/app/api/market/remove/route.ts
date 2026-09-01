import { auth } from '@/auth';
import { marketActionsService } from '@/lib/services/marketActionsService';
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

    const parsedPlayerId = parseInt(playerId);
    await marketActionsService.withdrawFromMarket({
      playerId: parsedPlayerId,
      userId: session.user.id,
    });

    return mutationSuccessResponse({ status: 'completed', playerId: parsedPlayerId });
  } catch {
    console.error('Market remove mutation failed');
    return errorResponse('Error al retirar del mercado', 500);
  }
}

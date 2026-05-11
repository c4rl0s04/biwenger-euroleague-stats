import { auth } from '@/auth';
import { marketActionsService } from '@/lib/services/marketActionsService';
import { successResponse, errorResponse } from '@/lib/utils/response';

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

    const result = await marketActionsService.withdrawFromMarket({
      playerId: parseInt(playerId),
      userId: session.user.id,
    });

    return successResponse(result, 200);
  } catch (error: any) {
    console.error('Market Remove API Error:', error);
    return errorResponse(error.message || 'Error al retirar del mercado', 500);
  }
}

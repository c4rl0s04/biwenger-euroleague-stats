import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { marketActionsService } from '@/lib/services/marketActionsService';
import { mutationSuccessResponse, errorResponse } from '@/lib/utils/response';

/**
 * Market Sell API Route
 * Endpoint: POST /api/market/sell
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the session
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('No autorizado. Debes iniciar sesión para vender jugadores.', 401);
    }

    // 2. Parse and validate the body
    const body = await request.json();
    const { playerId, price, type = 'sell' } = body;

    if (!playerId) {
      return errorResponse('ID de jugador faltante.', 400);
    }

    if (price === undefined || price === null) {
      return errorResponse('Precio de venta faltante.', 400);
    }

    // 3. Call the service to place the player on the market or sell immediately
    const parsedPlayerId = Number(playerId);
    await marketActionsService.placeOnMarket({
      playerId: parsedPlayerId,
      price: Number(price),
      type,
      userId: session.user.id as string,
    });

    return mutationSuccessResponse({
      message: 'Jugador procesado en el mercado correctamente',
      status: 'completed',
      playerId: parsedPlayerId,
      mode: type,
    });
  } catch {
    console.error('Market sell mutation failed');
    return errorResponse('Error al poner el jugador en el mercado', 500);
  }
}

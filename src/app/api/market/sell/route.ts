import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { marketActionsService } from '@/lib/services/marketActionsService';
import { successResponse, errorResponse } from '@/lib/utils/response';

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
    const result = await marketActionsService.placeOnMarket({
      playerId: Number(playerId),
      price: Number(price),
      type,
      userId: session.user.id as string,
    });

    // 3.5 Check for Biwenger API-level errors wrapped in 200 OK responses
    console.log('Biwenger API response for sell:', result);
    const hasErrorStatus = result && result.status && (result.status < 200 || result.status >= 300);
    if (result && (hasErrorStatus || result.error)) {
      return errorResponse(
        result.error || `Error de Biwenger (Código ${result.status})`,
        result.status && result.status >= 400 && result.status < 600 ? result.status : 400
      );
    }

    // 4. Return success
    return successResponse({
      message: 'Jugador procesado en el mercado correctamente',
      biwengerResponse: result,
    });
  } catch (error: any) {
    console.error('Market Sell API Error:', error);

    // Check if it's a Biwenger-specific error
    const message = error.message || 'Error al poner el jugador en el mercado';
    return errorResponse(message, 500);
  }
}

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { marketActionsService } from '@/lib/services/marketActionsService';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * Market Sell All API Route
 * Endpoint: POST /api/market/sell-all
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
    const { pricePercentage = 100 } = body;

    // 3. Call the service to place all players on the market
    const result = await marketActionsService.placeAllOnMarket({
      pricePercentage: Number(pricePercentage),
      userId: session.user.id as string,
    });

    // 3.5 Check for Biwenger API-level errors wrapped in 200 OK responses
    if (result && ((result.status && result.status !== 200) || result.error)) {
      return errorResponse(
        result.error || `Error de Biwenger (Código ${result.status})`,
        result.status || 400
      );
    }

    // 4. Return success stats
    return successResponse({
      message: 'Plantilla entera puesta en mercado',
      biwengerResponse: result,
    });
  } catch (error: any) {
    console.error('Market Sell All API Error:', error);
    return errorResponse(error.message || 'Error masivo al poner en el mercado', 500);
  }
}

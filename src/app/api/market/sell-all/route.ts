import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { marketCommandService, MarketCommandValidationError } from '@/features/market/server';
import { mutationSuccessResponse, errorResponse } from '@/lib/utils/response';

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

    // 2. Parse body
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // 3. Call the service to place all players on the market
    const result = await marketCommandService.sellAllSquad(session.user.id as string, body);

    return mutationSuccessResponse({
      message: result.message,
      status: result.status,
    });
  } catch (error: any) {
    if (error instanceof MarketCommandValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('[API Market Sell-All] Mutation failed');
    const message =
      error instanceof Error &&
      !error.message.includes('token') &&
      !error.message.includes('Bearer')
        ? error.message
        : 'Error masivo al poner en el mercado';
    return errorResponse(message, 500);
  }
}

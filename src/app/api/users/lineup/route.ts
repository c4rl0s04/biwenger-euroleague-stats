import { NextRequest } from 'next/server';
import { lineupService } from '@/lib/services/lineupService';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * Lineup Management API
 * Endpoint: POST /api/users/lineup
 * Body: { lineup: { type, playersID, reservesID, captain } }
 */
export async function POST(request: NextRequest) {
  try {
    const { lineup, userId } = await request.json();

    if (!lineup) {
      return errorResponse('Se requiere el objeto "lineup"', 400);
    }

    if (!userId) {
      return errorResponse('Se requiere el "userId" para seleccionar el token', 400);
    }

    // Forward the lineup and userId to the service
    const result = await lineupService.updateLineup({ lineup, userId });

    return successResponse({
      message: 'Alineación actualizada en Biwenger',
      biwengerResponse: result,
    });
  } catch (error: any) {
    console.error('[API Lineup] Error:', error);
    return errorResponse(error.message || 'Error al procesar la solicitud de alineación');
  }
}

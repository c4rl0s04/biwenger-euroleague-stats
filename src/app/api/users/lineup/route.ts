import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { lineupService } from '@/lib/services/lineupService';
import { errorResponse, mutationSuccessResponse, privateJsonResponse } from '@/lib/utils/response';

/**
 * Lineup Management API
 * Endpoint: POST /api/users/lineup
 * Body: { lineup: { type, playersID, reservesID, captain } }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse(
        'No autorizado. Debes iniciar sesion para actualizar tu alineacion.',
        401
      );
    }

    const { lineup } = await request.json();

    if (!lineup) {
      return errorResponse('Se requiere el objeto "lineup"', 400);
    }

    await lineupService.updateLineup({
      lineup,
      userId: session.user.id as string,
    });

    return mutationSuccessResponse({
      message: 'Alineación actualizada en Biwenger',
      status: 'completed',
    });
  } catch {
    console.error('[API Lineup] Mutation failed');
    return errorResponse('Error al procesar la solicitud de alineación');
  }
}

/**
 * GET /api/users/lineup
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse(
        'No autorizado. Debes iniciar sesion para consultar tu alineacion.',
        401
      );
    }

    const lineup = await lineupService.getLineup(session.user.id as string);

    return privateJsonResponse({ success: true, data: lineup });
  } catch {
    console.error('[API Lineup GET] Request failed');
    return errorResponse('Error al obtener la alineación');
  }
}

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import {
  lineupReadService,
  lineupCommandService,
  lineupErrorResponse,
} from '@/features/lineup/server';
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Se requiere el objeto "lineup"', 400);
    }

    if (!body || typeof body !== 'object' || !('lineup' in body) || !body.lineup) {
      return errorResponse('Se requiere el objeto "lineup"', 400);
    }

    const baseline = 'baseline' in body ? body.baseline : undefined;
    if (baseline !== undefined && (typeof baseline !== 'string' || baseline.length > 4096))
      return errorResponse('Referencia de alineación no válida.', 400);
    const result = await lineupCommandService.updateLineup(
      session.user.id as string,
      body.lineup,
      baseline
    );

    return mutationSuccessResponse({
      message: result.message,
      status: result.status,
    });
  } catch (error: unknown) {
    return lineupErrorResponse(error);
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

    const lineup = await lineupReadService.getLineup(session.user.id as string);

    return privateJsonResponse({ success: true, data: lineup });
  } catch (error: unknown) {
    return lineupErrorResponse(error);
  }
}

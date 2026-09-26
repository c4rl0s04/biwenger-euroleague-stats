import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import {
  lineupReadService,
  lineupCommandService,
  LineupValidationError,
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

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Se requiere el objeto "lineup"', 400);
    }

    if (!body || typeof body !== 'object' || !body.lineup) {
      return errorResponse('Se requiere el objeto "lineup"', 400);
    }

    const result = await lineupCommandService.updateLineup(session.user.id as string, body.lineup);

    return mutationSuccessResponse({
      message: result.message,
      status: result.status,
    });
  } catch (error: any) {
    if (error instanceof LineupValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('[API Lineup] Mutation failed');
    const message =
      error instanceof Error &&
      !error.message.includes('token') &&
      !error.message.includes('Bearer') &&
      !error.message.includes('authorization')
        ? error.message
        : 'Error al procesar la solicitud de alineación';
    return errorResponse(message, 500);
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
  } catch (error: any) {
    console.error('[API Lineup GET] Request failed');
    const message =
      error instanceof Error &&
      !error.message.includes('token') &&
      !error.message.includes('Bearer')
        ? error.message
        : 'Error al obtener la alineación';
    return errorResponse(message, 500);
  }
}

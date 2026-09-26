import { auth } from '@/auth';
import { marketCommandService, MarketCommandValidationError } from '@/features/market/server';
import { mutationSuccessResponse, errorResponse } from '@/lib/utils/response';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('No autorizado', 401);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Cuerpo de solicitud inválido', 400);
    }

    const result = await marketCommandService.rejectOffer(session.user.id as string, body);

    return mutationSuccessResponse({ status: result.status, offerId: result.offerId });
  } catch (error: any) {
    if (error instanceof MarketCommandValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('[API Market Offer Reject] Mutation failed');
    const message =
      error instanceof Error &&
      !error.message.includes('token') &&
      !error.message.includes('Bearer')
        ? error.message
        : 'Error al rechazar la oferta';
    return errorResponse(message, 500);
  }
}

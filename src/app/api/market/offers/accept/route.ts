import { auth } from '@/auth';
import { marketActionsService } from '@/lib/services/marketActionsService';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('No autorizado', 401);
    }

    const { offerId } = await request.json();

    if (!offerId) {
      return errorResponse('ID de oferta no proporcionado', 400);
    }

    const result = await marketActionsService.acceptOffer({
      offerId: parseInt(offerId),
      userId: session.user.id,
    });

    return successResponse(result, 200);
  } catch (error: any) {
    console.error('Offer Accept API Error:', error);
    return errorResponse(error.message || 'Error al aceptar la oferta', 500);
  }
}

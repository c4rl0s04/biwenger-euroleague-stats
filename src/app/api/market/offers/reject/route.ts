import { auth } from '@/auth';
import { marketActionsService } from '@/lib/services/marketActionsService';
import { mutationSuccessResponse, errorResponse } from '@/lib/utils/response';

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

    const parsedOfferId = parseInt(offerId);
    await marketActionsService.rejectOffer({
      offerId: parsedOfferId,
      userId: session.user.id,
    });

    return mutationSuccessResponse({ status: 'completed', offerId: parsedOfferId });
  } catch {
    console.error('Offer reject mutation failed');
    return errorResponse('Error al rechazar la oferta', 500);
  }
}

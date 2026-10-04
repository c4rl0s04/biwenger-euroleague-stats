import { auth } from '@/auth';
import { privateJsonResponse } from '@/lib/utils/response';
import { cancelScheduledPersonalBid, personalBidErrorResponse } from '@/features/market/server';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return privateJsonResponse({ message: 'No autorizado' }, 401);
  try {
    return privateJsonResponse({
      rule: await cancelScheduledPersonalBid(session.user.id, (await params).id),
    });
  } catch (error) {
    return personalBidErrorResponse(error);
  }
}

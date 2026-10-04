import { auth } from '@/auth';
import { privateJsonResponse } from '@/lib/utils/response';
import { readPersonalBidWorkspace, personalBidErrorResponse } from '@/features/market/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return privateJsonResponse({ message: 'No autorizado' }, 401);
  try {
    return privateJsonResponse(await readPersonalBidWorkspace(session.user.id));
  } catch (error) {
    return personalBidErrorResponse(error);
  }
}

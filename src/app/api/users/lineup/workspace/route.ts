import { auth } from '@/auth';
import { getLineupWorkspace, lineupErrorResponse } from '@/features/lineup/server';
import { errorResponse, privateJsonResponse } from '@/lib/utils/response';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse('Inicia sesión para consultar tu plantilla.', 401);
    return privateJsonResponse({
      success: true,
      data: await getLineupWorkspace(String(session.user.id)),
    });
  } catch (error) {
    return lineupErrorResponse(error);
  }
}

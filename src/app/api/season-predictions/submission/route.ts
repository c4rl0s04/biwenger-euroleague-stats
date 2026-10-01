import { auth } from '@/auth';
import { PredictionError, saveSeasonPredictions } from '@/features/season-predictions/server';
import { privateJsonResponse } from '@/lib/utils/response';

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return privateJsonResponse({ message: 'No autorizado' }, 401);
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 65536)
      return privateJsonResponse({ message: 'Solicitud demasiado grande' }, 413);
    body = JSON.parse(raw);
  } catch {
    return privateJsonResponse({ message: 'Solicitud inválida' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return privateJsonResponse({ message: 'Solicitud inválida' }, 400);
  const input = body as Record<string, unknown>;
  if (
    typeof input.seasonId !== 'string' ||
    !input.seasonId.trim() ||
    typeof input.revision !== 'number'
  )
    return privateJsonResponse({ message: 'Solicitud inválida' }, 400);
  try {
    const submission = await saveSeasonPredictions({
      seasonId: input.seasonId,
      userId: session.user.id,
      revision: input.revision,
      answers: input.answers,
    });
    return privateJsonResponse({ submission });
  } catch (error) {
    if (error instanceof PredictionError) {
      const status =
        error.code === 'conflict'
          ? 409
          : error.code === 'not-member'
            ? 403
            : error.code === 'locked'
              ? 423
              : error.code === 'not-open'
                ? 409
                : 400;
      return privateJsonResponse({ message: error.message, code: error.code }, status);
    }
    console.error('Season prediction save failed');
    return privateJsonResponse({ message: 'No se pudieron guardar las predicciones.' }, 500);
  }
}

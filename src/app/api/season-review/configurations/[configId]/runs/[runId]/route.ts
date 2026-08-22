import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmergentArtifactRepository } from '@/lib/season-review/emergent-artifact-service';
import { apiError, artifactError, requireSeasonReviewSession } from '../../../../api-utils';

export const runtime = 'nodejs';
const paramsSchema = z.object({
  configId: z.string().regex(/^s(?:1\d|2[0-5])-m20-inverse-(?:5000|7500|10000|12500|15000|17500)$/),
  runId: z.string().regex(/^run-\d+$/),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ configId: string; runId: string }> }
) {
  if (!(await requireSeasonReviewSession())) return apiError(401, 'UNAUTHORIZED', 'No autorizado');
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Ejecución no válida');
  try {
    const run = await getEmergentArtifactRepository().getRun(
      parsed.data.configId,
      parsed.data.runId
    );
    if (!run) return apiError(404, 'NOT_FOUND', 'Ejecución no encontrada');
    return NextResponse.json({ data: run });
  } catch (error) {
    return artifactError(error);
  }
}

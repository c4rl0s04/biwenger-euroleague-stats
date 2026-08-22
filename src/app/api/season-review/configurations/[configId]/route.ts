import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmergentArtifactRepository } from '@/lib/season-review/emergent-artifact-service';
import { apiError, artifactError, requireSeasonReviewSession } from '../../api-utils';

export const runtime = 'nodejs';
const configIdSchema = z
  .string()
  .regex(/^s(?:1\d|2[0-5])-m20-inverse-(?:5000|7500|10000|12500|15000|17500)$/);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  if (!(await requireSeasonReviewSession())) return apiError(401, 'UNAUTHORIZED', 'No autorizado');
  const parsed = configIdSchema.safeParse((await params).configId);
  if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Configuración no válida');
  try {
    const report = await getEmergentArtifactRepository().getReport(parsed.data);
    if (!report) return apiError(404, 'NOT_FOUND', 'Configuración no encontrada');
    return NextResponse.json({ data: report });
  } catch (error) {
    return artifactError(error);
  }
}

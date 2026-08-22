import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmergentArtifactRepository } from '@/lib/season-review/emergent-artifact-service';
import { apiError, artifactError, requireSeasonReviewSession } from '../../../api-utils';

export const runtime = 'nodejs';
const configIdSchema = z
  .string()
  .regex(/^s(?:1\d|2[0-5])-m20-inverse-(?:5000|7500|10000|12500|15000|17500)$/);
const querySchema = z.object({
  cursor: z.string().regex(/^\d+$/).nullable().default(null),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  if (!(await requireSeasonReviewSession())) return apiError(401, 'UNAUTHORIZED', 'No autorizado');
  const configId = configIdSchema.safeParse((await params).configId);
  const query = querySchema.safeParse({
    cursor: request.nextUrl.searchParams.get('cursor'),
    limit: request.nextUrl.searchParams.get('limit') || undefined,
  });
  if (!configId.success || !query.success)
    return apiError(422, 'VALIDATION_ERROR', 'Paginación o configuración no válida');
  try {
    const result = await getEmergentArtifactRepository().listRuns(configId.data, query.data);
    return NextResponse.json({
      data: result.data,
      pagination: { nextCursor: result.nextCursor, limit: query.data.limit, total: result.total },
    });
  } catch (error) {
    return artifactError(error);
  }
}

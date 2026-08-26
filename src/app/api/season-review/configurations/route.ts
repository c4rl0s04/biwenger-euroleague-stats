import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmergentArtifactRepository } from '@/lib/season-review/emergent-artifact-service';
import { toPublicEmergentCatalog } from '@/lib/season-review/emergent-artifacts';
import { apiError, artifactError, requireSeasonReviewSession } from '../api-utils';

export const runtime = 'nodejs';

const querySchema = z.object({
  rosterCap: z.coerce.number().int().min(10).max(25).optional(),
  eurosPerPoint: z.coerce
    .number()
    .refine((value) => [5_000, 7_500, 10_000, 12_500, 15_000, 17_500].includes(value))
    .optional(),
  cursor: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: NextRequest) {
  if (!(await requireSeasonReviewSession())) return apiError(401, 'UNAUTHORIZED', 'No autorizado');
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success)
    return apiError(422, 'VALIDATION_ERROR', 'Filtros no válidos', parsed.error.flatten());
  try {
    const catalog = toPublicEmergentCatalog(await getEmergentArtifactRepository().getCatalog());
    const filtered = catalog.configurations.filter(
      (entry) =>
        (parsed.data.rosterCap == null || entry.config.rosterCap === parsed.data.rosterCap) &&
        (parsed.data.eurosPerPoint == null ||
          entry.config.eurosPerPoint === parsed.data.eurosPerPoint)
    );
    const data = filtered.slice(parsed.data.cursor, parsed.data.cursor + parsed.data.limit);
    const nextOffset = parsed.data.cursor + data.length;
    return NextResponse.json({
      data,
      pagination: {
        cursor: parsed.data.cursor,
        nextCursor: nextOffset < filtered.length ? String(nextOffset) : null,
        limit: parsed.data.limit,
        total: filtered.length,
      },
      meta: {
        generationId: catalog.generationId,
        generatedAt: catalog.generatedAt,
        baseRuns: catalog.baseRuns,
        finalistRuns: catalog.finalistRuns,
        ranking: catalog.ranking,
      },
    });
  } catch (error) {
    return artifactError(error);
  }
}

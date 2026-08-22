import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status }
  );
}

export async function requireSeasonReviewSession() {
  const session = await auth();
  return session?.user?.id ? session : null;
}

export function artifactError(error: unknown) {
  console.error('Season review V5 artifact request failed:', error);
  if (error instanceof Error && error.message.includes('No published V5 generation'))
    return apiError(503, 'ARTIFACTS_PENDING', 'El análisis V5 todavía no está publicado');
  return apiError(500, 'INTERNAL_ERROR', 'No se pudo cargar el análisis V5');
}

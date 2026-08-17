'use server';

import { auth } from '@/auth';
import { simulateSeasonReview } from '@/lib/services';

export async function runSeasonReviewScenario(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: 'No autorizado' };
  try {
    const result = await simulateSeasonReview(input);
    return { success: true as const, data: result };
  } catch (error) {
    console.error('Season review simulation failed:', error);
    return { success: false as const, error: 'No se pudo calcular el escenario' };
  }
}

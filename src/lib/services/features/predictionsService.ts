import 'server-only';

/**
 * Predictions Service
 * Business logic layer for predictions-related operations
 */

import { getPorrasStats } from '@/features/predictions/server';

/**
 * Fetch all statistics for the Predictions (Porras) page.
 * @returns Aggregated predictions statistics
 */
export async function fetchPredictionsStats() {
  return await getPorrasStats();
}

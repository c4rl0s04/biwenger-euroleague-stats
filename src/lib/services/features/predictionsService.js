import 'server-only';

/**
 * Predictions Service
 * Business logic layer for predictions-related operations
 */

import { getPorrasStats } from '@/lib/db';

/**
 * Fetch all statistics for the Predictions (Porras) page.
 * @returns {Promise<Object>} Aggregated predictions statistics
 */
export async function fetchPredictionsStats() {
  return await getPorrasStats();
}

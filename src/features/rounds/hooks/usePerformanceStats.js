import { useMemo } from 'react';

import { calculateStats } from '../logic/performance';

export { calculateStats }; // Re-export for backward compatibility if needed locally

/**
 * Hook to calculate performance statistics from history data
 * @param {import('../models/round-read').UserPerformanceHistory[]} history
 */
export function usePerformanceStats(history) {
  return useMemo(() => calculateStats(history), [history]);
}

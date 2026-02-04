import { useMemo } from 'react';

import { calculateStats } from '../logic/performance';

export { calculateStats }; // Re-export for backward compatibility if needed locally

/**
 * Hook to calculate performance statistics from history data
 * @param {Array} history Array of round performance objects
 */
export function usePerformanceStats(history) {
  return useMemo(() => calculateStats(history), [history]);
}

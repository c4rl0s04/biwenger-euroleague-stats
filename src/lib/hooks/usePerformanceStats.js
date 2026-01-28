import { useMemo } from 'react';

/**
 * Pure function to calculate stats from a history array.
 * Useful for reusing logic outside the hook (e.g. for multiple users).
 */
export function calculateStats(history) {
  if (!history || history.length === 0) return null;

  const avgEfficiency = history.reduce((sum, r) => sum + r.efficiency, 0) / history.length;
  const totalActual = history.reduce((sum, r) => sum + r.actual_points, 0);
  const totalIdeal = history.reduce((sum, r) => sum + r.ideal_points, 0);
  const totalLost = totalIdeal - totalActual;

  const bestRound = history.reduce(
    (best, r) => (r.actual_points > best.actual_points ? r : best),
    history[0]
  );
  const bestEffRound = history.reduce(
    (best, r) => (r.efficiency > best.efficiency ? r : best),
    history[0]
  );
  const worstRound = history.reduce(
    (worst, r) => (r.actual_points < worst.actual_points ? r : worst),
    history[0]
  );

  return {
    avgEfficiency: avgEfficiency.toFixed(1),
    totalActual,
    totalIdeal,
    totalLost,
    bestRound,
    bestEffRound,
    worstRound,
    roundsPlayed: history.length,
  };
}

/**
 * Hook to calculate performance statistics from history data
 * @param {Array} history Array of round performance objects
 */
export function usePerformanceStats(history) {
  return useMemo(() => calculateStats(history), [history]);
}

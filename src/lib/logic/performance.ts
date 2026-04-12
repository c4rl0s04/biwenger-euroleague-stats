/**
 * Pure function to calculate stats from a history array.
 * Moved from hooks to Logic layer for shared usage (Service + UI).
 */

export interface RoundPerformance {
  efficiency: number;
  actual_points: number;
  ideal_points: number;
  [key: string]: any; // Allow other fields that might be passed
}

export interface CalculatedPerformanceStats {
  avgEfficiency: string;
  totalActual: number;
  totalIdeal: number;
  totalLost: number;
  bestRound: RoundPerformance;
  bestEffRound: RoundPerformance;
  worstRound: RoundPerformance;
  worstEffRound: RoundPerformance;
  bestIdealRound: RoundPerformance;
  maxLostRound: RoundPerformance;
  roundsPlayed: number;
}

export function calculateStats(
  history?: RoundPerformance[] | null
): CalculatedPerformanceStats | null {
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
  const worstEffRound = history.reduce(
    (worst, r) => (r.efficiency < worst.efficiency ? r : worst),
    history[0]
  );
  const worstRound = history.reduce(
    (worst, r) => (r.actual_points < worst.actual_points ? r : worst),
    history[0]
  );
  const bestIdealRound = history.reduce(
    (best, r) => (r.ideal_points > best.ideal_points ? r : best),
    history[0]
  );
  const maxLostRound = history.reduce((worst, r) => {
    const lostR = (r.ideal_points || 0) - (r.actual_points || 0);
    const lostBest = (worst.ideal_points || 0) - (worst.actual_points || 0);
    return lostR > lostBest ? r : worst;
  }, history[0]);

  return {
    avgEfficiency: avgEfficiency.toFixed(1),
    totalActual,
    totalIdeal,
    totalLost,
    bestRound,
    bestEffRound,
    worstRound,
    worstEffRound,
    bestIdealRound,
    maxLostRound,
    roundsPlayed: history.length,
  };
}

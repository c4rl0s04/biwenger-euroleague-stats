import type {
  LineupPlayer,
  OptimizationPlayerRow,
  OptimizationResult,
  OptimizedPlayer,
} from '../models/round-query-contracts';

/**
 * Helper: Infer a ghost player's position for the optimization pool.
 *
 * TITULAR ghost (starter in actual lineup):
 *   A valid 5-starter formation has at most 3 players per position (Base/Alero/Pivot).
 *   Knowing the other 4 starters' positions often uniquely identifies the ghost's position.
 *   If multiple positions are valid, we pick the rarest to minimise cap conflicts.
 *
 * BENCH / 6TH_MAN ghost:
 *   We can't determine their position from lineup structure (bench slots have no positional
 *   constraint). Instead, we use the rarest position across the whole squad pool so the
 *   ghost has the best chance of competing for an open starter slot in the ideal lineup.
 */
export function inferGhostPosition(
  allLineupPlayers: LineupPlayer[],
  ghost: LineupPlayer,
  squadPool?: OptimizationPlayerRow[]
): string {
  const POSITIONS = ['Base', 'Alero', 'Pivot'] as const;

  if (ghost.role !== 'titular') {
    // Bench / 6th_man ghost — position is unknown from lineup structure.
    // Use the rarest position in the existing squad pool to maximise starter-slot availability.
    const count: Record<string, number> = { Base: 0, Alero: 0, Pivot: 0 };
    for (const p of squadPool ?? []) {
      if (count[String(p.position)] !== undefined) count[String(p.position)]++;
    }
    return [...POSITIONS].sort((a, b) => count[a] - count[b])[0];
  }

  // Titular ghost — infer from the positions of the other 4 known starters.
  const count: Record<string, number> = { Base: 0, Alero: 0, Pivot: 0 };
  for (const p of allLineupPlayers) {
    if (!p.is_missing && p.role === 'titular' && count[p.position] !== undefined) {
      count[p.position]++;
    }
  }

  // Valid positions: those still under the starter cap of 3.
  const valid = POSITIONS.filter((pos) => count[pos] < 3);

  if (valid.length === 0) return 'Base'; // Defensive fallback (shouldn't happen).
  if (valid.length === 1) return valid[0]; // Uniquely determined.

  // Multiple valid slots — pick the rarest to leave the most room for other players.
  return [...valid].sort((a, b) => count[a] - count[b])[0];
}

/**
 * Helper: Calculate weighted sum of fantasy points for lineup players
 * Uses Biwenger multipliers: Captain 2x, Titular 1x, 6th Man 0.75x, Bench 0.5x
 */
export function calculateWeightedSum(
  players: { points: number | null; role: string | null; is_captain: boolean | null }[]
): number {
  return players.reduce((sum, p) => {
    const mult = p.is_captain
      ? 2.0
      : p.role === 'titular'
        ? 1.0
        : p.role === '6th_man'
          ? 0.75
          : 0.5;
    return sum + (p.points || 0) * mult;
  }, 0);
}

/** Preserve the historical greedy formation and unrounded total for owned squads. */
export function selectOptimalSquad(squadStats: OptimizationPlayerRow[]): OptimizationResult {
  // 3. Logic: Valid Formation Greedy Algorithm (Reused from Ideal Lineup / Coach Rating)
  // - Starts: 5 players. Max 3 per position.
  // - Bench: Next 5 best.

  const starters: OptimizationPlayerRow[] = [];
  const bench: OptimizationPlayerRow[] = [];
  const rolesCount: Record<string, number> = { Base: 0, Alero: 0, Pivot: 0 };
  const usedIds = new Set<number>();

  // A. Select Starters
  for (const p of squadStats) {
    if (starters.length >= 5) break;

    const pos = p.position || 'Base';
    if ((rolesCount[pos] || 0) < 3) {
      starters.push(p);
      rolesCount[pos] = (rolesCount[pos] || 0) + 1;
      usedIds.add(p.player_id);
    }
  }

  // B. Select Bench
  for (const p of squadStats) {
    if (bench.length >= 5) break;
    if (!usedIds.has(p.player_id)) {
      bench.push(p);
      usedIds.add(p.player_id);
    }
  }

  const optimalLineup = [...starters, ...bench];

  // Build the role-mapped lineup ONCE — used for both score calculation and the return value.
  // Previously the role mapping was done inline inside calculateWeightedSum and discarded,
  // so the returned optimalLineup had no role/is_captain info → all players showed as bench.
  const mappedLineup: OptimizedPlayer[] = optimalLineup.map((p, index) => {
    let role = 'bench';
    let is_captain = false;

    if (index < 5) {
      role = 'titular';
      if (index === 0) {
        is_captain = true;
      }
    } else {
      role = index === 5 ? '6th_man' : 'bench';
    }

    return { ...p, role, is_captain, points: p.points };
  });

  const totalPoints = calculateWeightedSum(mappedLineup);

  return {
    optimalLineup: mappedLineup,
    totalPoints,
  };
}

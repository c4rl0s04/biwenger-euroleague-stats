export type IdealLineupRole = 'titular' | '6th_man' | 'bench';

export interface IdealLineupCandidate {
  player_id: number;
  position?: string | null;
  points?: number | string | null;
}

export type SelectedIdealPlayer<T extends IdealLineupCandidate> = T & {
  role: IdealLineupRole;
  is_captain: boolean;
  stats_points: number;
  multiplier: number;
};

export function selectIdealLineup<T extends IdealLineupCandidate>(players: T[]) {
  const starters: T[] = [];
  const bench: T[] = [];
  const positions: Record<string, number> = { Base: 0, Alero: 0, Pivot: 0 };
  const usedIds = new Set<number>();

  for (const player of players) {
    if (starters.length >= 5) break;
    const position = player.position || 'Base';
    if ((positions[position] || 0) >= 3) continue;
    starters.push(player);
    positions[position] = (positions[position] || 0) + 1;
    usedIds.add(player.player_id);
  }

  for (const player of players) {
    if (bench.length >= 5) break;
    if (usedIds.has(player.player_id)) continue;
    bench.push(player);
    usedIds.add(player.player_id);
  }

  const idealLineup = [...starters, ...bench].map((player, index) => {
    const isCaptain = index === 0;
    const role: IdealLineupRole = index < 5 ? 'titular' : index === 5 ? '6th_man' : 'bench';
    const multiplier = isCaptain ? 2 : role === 'titular' ? 1 : role === '6th_man' ? 0.75 : 0.5;
    return {
      ...player,
      role,
      is_captain: isCaptain,
      stats_points: Number(player.points ?? 0),
      multiplier,
    } satisfies SelectedIdealPlayer<T>;
  });

  return {
    idealLineup,
    totalPoints: Math.round(
      idealLineup.reduce(
        (total, player) => total + Number(player.points ?? 0) * player.multiplier,
        0
      )
    ),
  };
}

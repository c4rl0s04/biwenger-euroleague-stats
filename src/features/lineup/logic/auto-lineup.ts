import type { SafeIdentifier, LineupCommandInput } from '../models/lineup';

export interface AutoAlignPlayer {
  id: SafeIdentifier;
  position?: string | null;
  puntos?: number | null;
}
export interface AutoAlignMatch<T extends AutoAlignPlayer> {
  date: string;
  user_players: T[];
}
type SelectedAutoAlignPlayer<T> = T & { matchDate: number; normPos: 'Base' | 'Alero' | 'Pivot' };
export function buildAutoLineup<T extends AutoAlignPlayer>(
  matches: AutoAlignMatch<T>[]
): {
  starters: SelectedAutoAlignPlayer<T>[];
  bench: SelectedAutoAlignPlayer<T>[];
  captain: SelectedAutoAlignPlayer<T>;
  formationType: string;
  lineupPayload: LineupCommandInput;
} {
  // 1. Flatten and Sort Players by Date
  const allPlayers = matches
    .flatMap((m) => m.user_players.map((p) => ({ ...p, matchDate: new Date(m.date).getTime() })))
    .sort((a, b) => a.matchDate - b.matchDate);

  if (allPlayers.length === 0) {
    throw new Error('No tienes jugadores que jueguen en esta jornada.');
  }

  // 2. Greedy Selection for Starters (Max 3 per position)
  const startersRaw: SelectedAutoAlignPlayer<T>[] = [];
  const benchCandidates: SelectedAutoAlignPlayer<T>[] = [];
  const posCount = { Base: 0, Alero: 0, Pivot: 0 };

  // Helper to normalize positions (handle database variations)
  const getNormalizedPos = (pos?: string | null): 'Base' | 'Alero' | 'Pivot' => {
    if (!pos) return 'Base';
    if (pos.includes('Base') || pos === 'Guard') return 'Base';
    if (pos.includes('Alero') || pos === 'Forward') return 'Alero';
    if (pos.includes('Pivot') || pos === 'Center') return 'Pivot';
    return 'Base';
  };

  for (const p of allPlayers) {
    const normPos = getNormalizedPos(p.position);
    if (startersRaw.length < 5 && (posCount[normPos] || 0) < 3) {
      startersRaw.push({ ...p, normPos });
      posCount[normPos] = (posCount[normPos] || 0) + 1;
    } else {
      benchCandidates.push({ ...p, normPos });
    }
  }

  if (startersRaw.length < 5) {
    throw new Error(
      `No tienes suficientes jugadores para formar una alineación válida (Faltan ${5 - startersRaw.length} posiciones).`
    );
  }

  // CRITICAL: Sort starters to match the formation string (Bases -> Aleros -> Pivots)
  const starters = [
    ...startersRaw.filter((p) => p.normPos === 'Base'),
    ...startersRaw.filter((p) => p.normPos === 'Alero'),
    ...startersRaw.filter((p) => p.normPos === 'Pivot'),
  ];

  // 3. Select Captain (Highest total points among starters)
  // Note: p.puntos is the total points in the season
  const captain = [...starters].sort((a, b) => (b.puntos || 0) - (a.puntos || 0))[0];

  // 4. Fill Bench (Next 5 earliest players)
  const bench = benchCandidates.slice(0, 5);

  // 5. Construct Payload
  const formationType = `${posCount.Base}-${posCount.Alero}-${posCount.Pivot}`;
  const playersID = [...starters.map((s) => s.id), ...bench.map((b) => b.id)];

  const lineupPayload = {
    type: formationType,
    playersID: playersID,
    reservesID: [],
    captain: captain.id,
  };

  return { starters, bench, captain, formationType, lineupPayload };
}

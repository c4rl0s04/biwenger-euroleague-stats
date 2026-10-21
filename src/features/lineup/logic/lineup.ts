import type { LineupSlotIdentifier } from '../models/lineup';

export type LineupIdentifier = string | number;
export interface TacticalPlayer {
  id?: LineupIdentifier;
  position?: string | null;
  average?: number | null;
  puntos?: number | null;
  price?: number | null;
}
export interface TacticalLineup {
  playersID?: LineupSlotIdentifier[];
  reservesID?: LineupSlotIdentifier[];
  captain?: LineupIdentifier | null;
  type?: string;
}
export interface NormalizedLineup {
  playersID: (string | null)[];
  reservesID: (string | null)[];
  captain: string | null;
  type: string;
}
export interface LineupNormalizationInput {
  playersID?: unknown;
  reservesID?: unknown;
  captain?: LineupIdentifier | { id?: LineupIdentifier } | null;
  type?: string;
}

/**
 * Lineup Logic Utility
 * Professional tactical realignment and rotation management.
 */

/**
 * Parse formation type string (e.g. "2-2-1") into position requirements
 * Euroleague: [Bases, Aleros, Pivots] -> [Pos 1, Pos 2, Pos 3]
 */
export function parseFormation(type: string): Record<string, number> {
  const [b, a, p] = type.split('-').map(Number);
  return { Base: b, Alero: a, Pivot: p };
}

function starterPositions(type = '2-2-1'): string[] {
  const counts = Object.values(parseFormation(type));
  const valid =
    counts.every((n) => Number.isInteger(n) && n >= 0 && n <= 5) &&
    counts.reduce((a, b) => a + b, 0) === 5;
  return (valid ? counts : [2, 2, 1]).flatMap((count, i) =>
    Array<string>(count).fill(['Base', 'Alero', 'Pivot'][i])
  );
}

/**
 * Calculates a weighted performance score for a player.
 */
export function calculatePerfScore(
  player: TacticalPlayer | null | undefined,
  captainId?: LineupIdentifier | null
): number {
  if (!player) return -1;
  const isCap = String(player.id) === String(captainId);
  // Priority: Captain > Avg Points > Total Points > Price
  return (
    (isCap ? 10000 : 0) +
    (player.average || 0) * 100 +
    (player.puntos || 0) +
    (player.price || 0) / 1000000
  );
}

/**
 * Conservative Realignment Algorithm (Rotation Keeper)
 * 1. Maintains the 5 starters matching the formation.
 * 2. Keeps exactly 5 players on the bench.
 * 3. Minimizes changes to the user's manual selection.
 */
export function realignTactics(
  newType: string,
  squad: TacticalPlayer[],
  currentLineup: TacticalLineup
): { playersID: (string | null)[]; reservesID: string[] } {
  const positions = starterPositions(newType);
  const targets = Object.fromEntries(
    ['Base', 'Alero', 'Pivot'].map((pos) => [pos, positions.filter((p) => p === pos).length])
  );
  const getPlayer = (id: LineupSlotIdentifier) => squad.find((p) => String(p.id) === String(id));

  // In this mode, playersID contains all 10 (Starters + Bench)
  const allActiveIds = Array.isArray(currentLineup.playersID) ? currentLineup.playersID : [];

  let S = allActiveIds
    .slice(0, 5)
    .map(getPlayer)
    .filter((player): player is TacticalPlayer => Boolean(player));
  let B = allActiveIds
    .slice(5, 10)
    .map(getPlayer)
    .filter((player): player is TacticalPlayer => Boolean(player));

  const activeIds = new Set([...S, ...B].map((p) => String(p.id)));
  let R = squad.filter((p) => !activeIds.has(String(p.id)));

  const sortByPerf = (a: TacticalPlayer, b: TacticalPlayer) =>
    calculatePerfScore(b, currentLineup.captain) - calculatePerfScore(a, currentLineup.captain);
  const sortByPerfAsc = (a: TacticalPlayer, b: TacticalPlayer) =>
    calculatePerfScore(a, currentLineup.captain) - calculatePerfScore(b, currentLineup.captain);

  // 1. Identify current counts
  const C: Record<string, number> = { Base: 0, Alero: 0, Pivot: 0 };
  S.forEach((p) => {
    const pos = p.position || 'Base';
    C[pos] = (C[pos] || 0) + 1;
  });

  const posNames = ['Base', 'Alero', 'Pivot'];
  const U: Record<string, number> = {}; // Surplus
  const D: Record<string, number> = {}; // Deficit
  posNames.forEach((pos) => {
    U[pos] = Math.max(0, C[pos] - targets[pos]);
    D[pos] = Math.max(0, targets[pos] - C[pos]);
  });

  let demotedPool: TacticalPlayer[] = [];

  // 2. Remove Surplus from Starters
  posNames.forEach((pos) => {
    if (U[pos] > 0) {
      let posStarters = S.filter((p) => (p.position || 'Base') === pos);
      posStarters.sort(sortByPerfAsc); // Worst first

      const removed = posStarters.slice(0, U[pos]);
      demotedPool.push(...removed);

      const removedIds = new Set(removed.map((p) => String(p.id)));
      S = S.filter((p) => !removedIds.has(String(p.id)));
    }
  });

  // 3. Fill Deficit in Starters
  posNames.forEach((pos) => {
    let needed = D[pos];
    if (needed > 0) {
      // Try Bench first
      let candidatesB = B.filter((p) => (p.position || 'Base') === pos).sort(sortByPerf);
      let takenFromB = candidatesB.slice(0, needed);

      S.push(...takenFromB);
      const takenBIds = new Set(takenFromB.map((p) => String(p.id)));
      B = B.filter((p) => !takenBIds.has(String(p.id)));

      needed -= takenFromB.length;

      // Try Reserves next
      if (needed > 0) {
        let candidatesR = R.filter((p) => (p.position || 'Base') === pos).sort(sortByPerf);
        let takenFromR = candidatesR.slice(0, needed);

        S.push(...takenFromR);
        const takenRIds = new Set(takenFromR.map((p) => String(p.id)));
        R = R.filter((p) => !takenRIds.has(String(p.id)));
      }
    }
  });

  // 4. Manage Bench (Must be exactly 5 if squad allows)
  let newB = [...B, ...demotedPool].sort(sortByPerf);

  if (newB.length < 5 && R.length > 0) {
    R.sort(sortByPerf);
    const filler = R.slice(0, 5 - newB.length);
    newB.push(...filler);
    const fillerIds = new Set(filler.map((p) => String(p.id)));
    R = R.filter((p) => !fillerIds.has(String(p.id)));
  }

  const finalB = newB.slice(0, 5);
  const overflow = newB.slice(5);
  const finalR = [...R, ...overflow].sort(sortByPerf);

  // Keep unfilled starter positions ahead of the bench, even after explicit realignment.
  const remaining = [...S];
  const starterIds = positions.map((pos) => {
    const index = remaining.findIndex((p) => (p.position || 'Base') === pos);
    return index === -1 ? null : String(remaining.splice(index, 1)[0].id);
  });
  const finalIds = [
    ...starterIds,
    ...Array.from({ length: 5 }, (_, i) => (finalB[i] ? String(finalB[i].id) : null)),
  ];

  return {
    playersID: finalIds,
    reservesID: Array.from(new Set(finalR.map((p) => String(p.id)))),
  };
}

/**
 * Perform a manual player swap or replacement
 */
export function performSwap<T extends TacticalLineup>(
  targetId: LineupIdentifier | { slotIndex: number },
  newId: LineupIdentifier,
  currentLineup: T
): T | (Omit<T, 'playersID' | 'reservesID' | 'captain'> & TacticalLineup) {
  // Normalize all input IDs to strings for reliable comparison
  const tId = typeof targetId === 'object' ? null : String(targetId);
  const nId = String(newId);

  let playersID = Array.from(currentLineup.playersID || [], (id) =>
    id == null ? null : String(id)
  );
  let reservesID = Array.from(currentLineup.reservesID || [], (id) =>
    id == null ? null : String(id)
  );

  const targetIdx =
    typeof targetId === 'object' ? targetId.slotIndex : playersID.findIndex((id) => id === tId);
  const newActiveIdx = playersID.findIndex((id) => id === nId);
  const newReserveIdx = reservesID.findIndex((id) => id === nId);

  if (!Number.isInteger(targetIdx) || targetIdx < 0 || targetIdx >= 10) return currentLineup;
  while (playersID.length <= targetIdx) playersID.push(null);
  const oldId = playersID[targetIdx];

  if (newActiveIdx !== -1) {
    // SCENARIO 1: Swap between two active players (Starters/Bench)
    const temp = playersID[targetIdx];
    playersID[targetIdx] = playersID[newActiveIdx];
    playersID[newActiveIdx] = temp;
  } else {
    // SCENARIO 2: Replace active player with someone from squad/reserves
    // (They are not in playersID, so they must be entering from the outside)
    playersID[targetIdx] = nId;

    // Move old player to reserves, remove new player from reserves
    if (newReserveIdx !== -1) {
      reservesID[newReserveIdx] = oldId;
    } else if (oldId !== null && !reservesID.includes(oldId)) {
      const emptyReserve = reservesID.indexOf(null);
      if (emptyReserve === -1) reservesID.push(oldId);
      else reservesID[emptyReserve] = oldId;
    }
  }

  // Deduplicate just in case
  playersID = playersID
    .filter((id, index, ids) => id === null || ids.indexOf(id) === index)
    .slice(0, 10);
  reservesID = reservesID.filter((id, index, ids) => id === null || ids.indexOf(id) === index);

  // If the target was the captain, transfer captaincy to the new player
  let captain = currentLineup.captain;
  if (oldId !== null && String(captain) === oldId) {
    captain = nId;
  }

  return {
    ...currentLineup,
    playersID,
    reservesID,
    captain,
  };
}

/**
 * Map a raw Biwenger lineup object into a normalized config
 */
export function normalizeLineupConfig(
  lineup: LineupNormalizationInput | null = {}
): NormalizedLineup {
  lineup = lineup ?? {};
  let captainId = lineup.captain;
  if (captainId && typeof captainId === 'object') captainId = captainId.id;

  const allIds = Array.isArray(lineup.playersID)
    ? Array.from(lineup.playersID, (id) => (id == null ? null : String(id)))
    : [];

  return {
    playersID: allIds, // All 10
    reservesID: Array.isArray(lineup.reservesID)
      ? Array.from(lineup.reservesID, (id) => (id == null ? null : String(id)))
      : [],
    captain: captainId ? String(captainId) : null,
    type: lineup.type || '2-2-1',
  };
}

/**
 * Derive starters and bench player objects from IDs + squad
 */
export interface LineupRotationSlot<T extends TacticalPlayer = TacticalPlayer> {
  slotIndex: number;
  position: string | null;
  playerId: LineupSlotIdentifier;
  player: (T & { is_captain: boolean }) | null;
}

export function deriveRotation<T extends TacticalPlayer>(
  lineupConfig: TacticalLineup,
  squad: T[] | null | undefined
): { starters: LineupRotationSlot<T>[]; bench: LineupRotationSlot<T>[] } {
  const safeSquad = Array.isArray(squad) ? squad : [];
  const positions = starterPositions(lineupConfig.type);
  const slots = Array.from({ length: 10 }, (_, slotIndex) => {
    const playerId = lineupConfig.playersID?.[slotIndex] ?? null;
    const player =
      playerId == null ? null : safeSquad.find((p) => p && String(p.id) === String(playerId));
    return {
      slotIndex,
      position: slotIndex < 5 ? positions[slotIndex] : (player?.position ?? null),
      playerId,
      player: player
        ? {
            ...player,
            is_captain: slotIndex < 5 && String(playerId) === String(lineupConfig.captain),
          }
        : null,
    };
  });
  return { starters: slots.slice(0, 5), bench: slots.slice(5) };
}

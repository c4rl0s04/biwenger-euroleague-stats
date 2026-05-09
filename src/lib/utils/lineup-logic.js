/**
 * Lineup Logic Utility
 * Professional tactical realignment and rotation management.
 */

/**
 * Parse formation type string (e.g. "2-2-1") into position requirements
 * Euroleague: [Bases, Aleros, Pivots] -> [Pos 1, Pos 2, Pos 3]
 */
export function parseFormation(type) {
  const [b, a, p] = type.split('-').map(Number);
  return { Base: b, Alero: a, Pivot: p };
}

/**
 * Calculates a weighted performance score for a player.
 */
export function calculatePerfScore(player, captainId) {
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
export function realignTactics(newType, squad, currentLineup) {
  const targets = parseFormation(newType);
  const getPlayer = (id) => squad.find((p) => String(p.id) === String(id));

  // In this mode, playersID contains all 10 (Starters + Bench)
  const allActiveIds = Array.isArray(currentLineup.playersID) ? currentLineup.playersID : [];

  let S = allActiveIds.slice(0, 5).map(getPlayer).filter(Boolean);
  let B = allActiveIds.slice(5, 10).map(getPlayer).filter(Boolean);

  const activeIds = new Set([...S, ...B].map((p) => String(p.id)));
  let R = squad.filter((p) => !activeIds.has(String(p.id)));

  const sortByPerf = (a, b) =>
    calculatePerfScore(b, currentLineup.captain) - calculatePerfScore(a, currentLineup.captain);
  const sortByPerfAsc = (a, b) =>
    calculatePerfScore(a, currentLineup.captain) - calculatePerfScore(b, currentLineup.captain);

  // 1. Identify current counts
  const C = { Base: 0, Alero: 0, Pivot: 0 };
  S.forEach((p) => {
    const pos = p.position || 'Base';
    C[pos] = (C[pos] || 0) + 1;
  });

  const posNames = ['Base', 'Alero', 'Pivot'];
  const U = {}; // Surplus
  const D = {}; // Deficit
  posNames.forEach((pos) => {
    U[pos] = Math.max(0, C[pos] - targets[pos]);
    D[pos] = Math.max(0, targets[pos] - C[pos]);
  });

  let demotedPool = [];

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

  // CRITICAL: Starters (S) must be ordered by position to match Biwenger's internal validation
  // Order: Base -> Alero -> Pivot
  const posOrder = { Base: 1, Alero: 2, Pivot: 3 };
  const sortedS = [...S].sort((a, b) => {
    const orderA = posOrder[a.position] || 1;
    const orderB = posOrder[b.position] || 1;
    return orderA - orderB;
  });

  // Return exactly 10 in playersID (5 sorted starters + 5 bench)
  // Ensure we have exactly 10 unique IDs as strings
  const finalIds = [...new Set([...sortedS, ...finalB].map((p) => String(p.id)))].slice(0, 10);

  return {
    playersID: finalIds,
    reservesID: [...new Set(finalR.map((p) => String(p.id)))],
  };
}

/**
 * Perform a manual player swap or replacement
 */
export function performSwap(targetId, newId, currentLineup) {
  // Normalize all input IDs to strings for reliable comparison
  const tId = String(targetId);
  const nId = String(newId);

  let playersID = [...(currentLineup.playersID || [])].map(String);
  let reservesID = [...(currentLineup.reservesID || [])].map(String);

  const targetIdx = playersID.findIndex((id) => id === tId);
  const newActiveIdx = playersID.findIndex((id) => id === nId);
  const newReserveIdx = reservesID.findIndex((id) => id === nId);

  if (targetIdx === -1) return currentLineup; // Safety check

  if (newActiveIdx !== -1) {
    // SCENARIO 1: Swap between two active players (Starters/Bench)
    const temp = playersID[targetIdx];
    playersID[targetIdx] = playersID[newActiveIdx];
    playersID[newActiveIdx] = temp;
  } else {
    // SCENARIO 2: Replace active player with someone from squad/reserves
    // (They are not in playersID, so they must be entering from the outside)
    const oldId = playersID[targetIdx];
    playersID[targetIdx] = nId;

    // Move old player to reserves, remove new player from reserves
    reservesID = reservesID.filter((id) => id !== nId);
    if (!reservesID.includes(oldId)) {
      reservesID.push(oldId);
    }
  }

  // Deduplicate just in case
  playersID = [...new Set(playersID)].slice(0, 10);
  reservesID = [...new Set(reservesID)];

  // If the target was the captain, transfer captaincy to the new player
  let captain = currentLineup.captain;
  if (String(captain) === tId) {
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
export function normalizeLineupConfig(lineup = {}) {
  let captainId = lineup.captain;
  if (captainId && typeof captainId === 'object') captainId = captainId.id;

  const allIds = Array.isArray(lineup.playersID) ? lineup.playersID.map(String) : [];

  return {
    playersID: allIds, // All 10
    reservesID: Array.isArray(lineup.reservesID) ? lineup.reservesID.map(String) : [],
    captain: captainId ? String(captainId) : null,
    type: lineup.type || '2-2-1',
  };
}

/**
 * Derive starters and bench player objects from IDs + squad
 */
export function deriveRotation(lineupConfig, squad) {
  const safeSquad = Array.isArray(squad) ? squad : [];
  const getById = (id) => safeSquad.find((p) => p && String(p.id) === String(id));

  const allActiveIds = Array.isArray(lineupConfig.playersID) ? lineupConfig.playersID : [];

  const starters = allActiveIds
    .slice(0, 5)
    .map((id) => {
      const p = getById(id);
      return p ? { ...p, is_captain: String(id) === String(lineupConfig.captain) } : null;
    })
    .filter(Boolean);

  const bench = allActiveIds
    .slice(5, 10)
    .map((id) => getById(id))
    .filter(Boolean);

  return { starters, bench };
}

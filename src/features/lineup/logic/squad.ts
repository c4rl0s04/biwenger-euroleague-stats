import type {
  SafeIdentifier,
  SafeLineupResponse,
  SafeLineupOffer,
  SafeLineupPlayerOwner,
} from '../models/lineup';

interface SquadIdentity {
  id: SafeIdentifier;
}
interface SwapPlayer extends SquadIdentity {
  position?: string | null;
  average?: number | null;
  points?: number | null;
}

export function rankSwapCandidates<T extends SwapPlayer>(
  squad: T[],
  target: T,
  isStarter: boolean,
  activeIds: ReadonlySet<string>
): T[] {
  return squad
    .filter(
      (p) => (!isStarter || p.position === target.position) && String(p.id) !== String(target.id)
    )
    .sort((a, b) => {
      const aActive = activeIds.has(String(a.id));
      const bActive = activeIds.has(String(b.id));
      if (aActive !== bActive) return aActive ? -1 : 1;
      return (b.average || 0) * 100 + (b.points || 0) - ((a.average || 0) * 100 + (a.points || 0));
    });
}

/** Squad-table compatibility: excludes X; unknown (?) propagates NaN and the table sorts it as zero.
 * This intentionally differs from competition form. Changing it requires a separate behavior fix.
 */
export function calculateSquadFormAverage(recentScores?: string | null): number {
  const scores = recentScores
    ? recentScores
        .split(',')
        .filter((s) => s !== 'X')
        .map(Number)
    : [];
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

export function enrichLineupSquad<T extends SquadIdentity>(
  players: T[],
  data?: SafeLineupResponse | null
): Array<
  T & {
    isOnSale: boolean;
    listingPrice: number | null;
    offers: SafeLineupOffer[];
    owner: SafeLineupPlayerOwner | null;
  }
> {
  const onSaleIds = new Set<string>();
  const listingPrices = new Map<string, number>();
  const playerOffers = new Map<string, SafeLineupOffer[]>();
  const purchaseMap = new Map<string, SafeLineupPlayerOwner>();
  for (const p of data?.players || []) {
    if (p.id && p.owner) purchaseMap.set(String(p.id), p.owner);
  }
  for (const m of data?.market || []) {
    const id = m.playerID || m.player?.id || m.id;
    if (id) {
      onSaleIds.add(String(id));
      if (m.price) listingPrices.set(String(id), m.price);
    }
  }
  for (const offer of data?.offers || []) {
    if (Array.isArray(offer.requestedPlayers)) {
      for (const id of offer.requestedPlayers) {
        const pid = String(id);
        onSaleIds.add(pid);
        if (!playerOffers.has(pid)) playerOffers.set(pid, []);
        playerOffers.get(pid)!.push(offer);
      }
    }
  }
  return players.map((p) => ({
    ...p,
    isOnSale: onSaleIds.has(String(p.id)),
    listingPrice: listingPrices.get(String(p.id)) || null,
    offers: playerOffers.get(String(p.id)) || [],
    owner: purchaseMap.get(String(p.id)) || null,
  }));
}

import type { TournamentFixture, TournamentJson } from '../../models/tournaments';
import type { TournamentPlayoffRules } from '../../models/tournament-playoff-rules';
import type {
  TournamentBracketMatch,
  TournamentBracketRound,
} from '../../models/tournament-bracket';
import { snapshotProperty } from './tournament-display';

interface Phase {
  id: number | string | null;
  type: string | null;
  name: string | null;
  fixtures: TournamentFixture[];
}

function phaseType(value: TournamentJson | undefined): string | null {
  if (!value) return null;
  if (typeof value !== 'string') throw new TypeError('Tournament phase type is not a string');
  return value;
}

function matchingRound(snapshot: TournamentJson, name: string | null): TournamentJson | undefined {
  const rounds = snapshotProperty(snapshot, 'rounds');
  if (rounds === null || rounds === undefined) return undefined;
  if (!Array.isArray(rounds)) throw new TypeError('Tournament rounds is not an array');
  return rounds.find((round) => {
    if (round === null) throw new TypeError('Tournament round is null');
    return snapshotProperty(snapshotProperty(round, 'round'), 'name') === name;
  });
}

/** No I/O or cache. Fixture order, pairing, first-leg completion and null arithmetic are preserved. */
export function mapTournamentBracket(
  snapshot: TournamentJson,
  fixtures: TournamentFixture[],
  playoffRules: TournamentPlayoffRules
): TournamentBracketRound[] {
  const { twoLegged: isTwoLegged, twoLeggedFinal: isTwoLeggedFinal } = playoffRules;
  if (!fixtures?.length) return [];

  // 1. Group items by their logical Phase
  const phaseMap: Record<string, Phase> = {};
  fixtures.forEach((f) => {
    // Determine what phase this round belongs to
    let pId: number | string | null = f.phase_id;
    let pType = f.phase_type;
    let pName = f.phase_name;

    // Fallback: Check the tournament config rounds list
    if (!pId || !pType) {
      const rConf = matchingRound(snapshot, f.round_name);
      if (rConf) {
        pType = phaseType(snapshotProperty(rConf, 'type'));
        // Use type as ID if we don't have a better one
        pId = pId || phaseType(snapshotProperty(rConf, 'type'));
      }
    }

    const gId = String(pId || pType || pName || f.round_name);

    if (!phaseMap[gId]) {
      phaseMap[gId] = {
        id: pId,
        type: pType,
        name: pName || f.round_name,
        fixtures: [],
      };
    }
    phaseMap[gId].fixtures.push(f);
  });

  const phaseArray = Object.values(phaseMap).sort((a, b) => {
    const order = ['roundof32', 'roundof16', 'quarterfinal', 'semifinal', 'final', 'gran final'];
    const ia = order.findIndex((t) => (a.type || a.name || '').toLowerCase().includes(t));
    const ib = order.findIndex((t) => (b.type || b.name || '').toLowerCase().includes(t));
    if (ia !== -1 && ib !== -1) return ia - ib;
    return Number(a.id || 0) - Number(b.id || 0);
  });

  // 2. Process Aggregation per Phase
  return phaseArray.map((phase) => {
    const aggregatedMatches: TournamentBracketMatch[] = [];
    const matches = phase.fixtures;

    const isFinalPhase =
      (phase.type || phase.name || '').toLowerCase().includes('final') &&
      !(phase.type || phase.name || '').toLowerCase().includes('quarter') &&
      !(phase.type || phase.name || '').toLowerCase().includes('semi');

    const shouldAggregate = isTwoLegged && (!isFinalPhase || isTwoLeggedFinal);

    if (shouldAggregate) {
      const processedIds = new Set();
      matches.forEach((f) => {
        if (processedIds.has(f.id)) return;

        // Find partner leg
        const leg2 = matches.find(
          (m) =>
            !processedIds.has(m.id) &&
            m.id !== f.id &&
            ((String(m.home_user_id) === String(f.away_user_id) &&
              String(m.away_user_id) === String(f.home_user_id)) ||
              (String(m.home_user_id) === String(f.home_user_id) &&
                String(m.away_user_id) === String(f.away_user_id)))
        );

        const hLeg1 = f.home_score ?? 0;
        const aLeg1 = f.away_score ?? 0;
        const hLeg2 = leg2
          ? leg2.home_user_id === f.home_user_id
            ? leg2.home_score
            : leg2.away_score
          : 0;
        const aLeg2 = leg2
          ? leg2.away_user_id === f.away_user_id
            ? leg2.away_score
            : leg2.home_score
          : 0;
        const hTotal = hLeg1 + hLeg2!;
        const aTotal = aLeg1 + aLeg2!;

        const hasHome = !!f.home_user_id;
        const hasAway = !!f.away_user_id;

        const isFinished = (hasHome && f.home_score !== null) || (hasAway && f.away_score !== null);

        let winner: TournamentBracketMatch['winner'] = null;
        if (isFinished) {
          if (hasHome && !hasAway) winner = 'home';
          else if (!hasHome && hasAway) winner = 'away';
          else winner = hTotal > aTotal ? 'home' : aTotal > hTotal ? 'away' : null;
        }

        aggregatedMatches.push({
          id: `agg-${f.id}`,
          isTwoLegged: true,
          isFinished,
          winner,
          home_user_id: f.home_user_id,
          home_user_name: f.home_user_name,
          home_user_icon: f.home_user_icon,
          home_user_color: f.home_user_color,
          away_user_id: f.away_user_id,
          away_user_name: f.away_user_name,
          away_user_icon: f.away_user_icon,
          away_user_color: f.away_user_color,
          home_leg1: f.home_score,
          away_leg1: f.away_score,
          home_leg2: leg2
            ? leg2.home_user_id === f.home_user_id
              ? leg2.home_score
              : leg2.away_score
            : null,
          away_leg2: leg2
            ? leg2.away_user_id === f.away_user_id
              ? leg2.away_score
              : leg2.home_score
            : null,
          home_total: hTotal,
          away_total: aTotal,
        });
        processedIds.add(f.id);
        if (leg2) processedIds.add(leg2.id);
      });
    } else {
      // Single leg behavior
      matches.forEach((f) => {
        const hTotal = f.home_score ?? 0;
        const aTotal = f.away_score ?? 0;
        const hasHome = !!f.home_user_id;
        const hasAway = !!f.away_user_id;

        const isFinished = (hasHome && f.home_score !== null) || (hasAway && f.away_score !== null);

        let winner: TournamentBracketMatch['winner'] = null;
        if (isFinished) {
          if (hasHome && !hasAway) winner = 'home';
          else if (!hasHome && hasAway) winner = 'away';
          else winner = hTotal > aTotal ? 'home' : aTotal > hTotal ? 'away' : null;
        }

        aggregatedMatches.push({
          id: f.id,
          home_user_id: f.home_user_id,
          home_user_name: f.home_user_name,
          home_user_icon: f.home_user_icon,
          home_user_color: f.home_user_color,
          away_user_id: f.away_user_id,
          away_user_name: f.away_user_name,
          away_user_icon: f.away_user_icon,
          away_user_color: f.away_user_color,
          isTwoLegged: false,
          isFinished,
          home_total: f.home_score,
          away_total: f.away_score,
          winner,
        });
      });
    }

    return {
      type: phase.type,
      name: phase.name,
      matches: aggregatedMatches.sort((a, b) => a.id.toString().localeCompare(b.id.toString())),
    };
  });
}

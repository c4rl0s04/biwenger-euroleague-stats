import type {
  MatchRoundViewModel,
  MatchScheduleViewModel,
  MatchTeamViewModel,
  MatchViewModel,
} from '../../models/match';
import type { MatchListRow } from '../queries/match-list.query';

function serializeDate(value: Date | string | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapTeam(row: MatchListRow, side: 'home' | 'away'): MatchTeamViewModel {
  const home = side === 'home';
  return {
    id: home ? row.homeId : row.awayId,
    name: (home ? row.homeName : row.awayName) || (home ? 'Local' : 'Visitante'),
    code: (home ? row.homeCode : row.awayCode) || '',
    imageUrl: (home ? row.homeImageUrl : row.awayImageUrl) || '',
    score: home ? row.homeScore : row.awayScore,
    city: (home ? row.homeCity : row.awayCity) || null,
    arena: (home ? row.homeArena : row.awayArena) || null,
    latitude: home ? row.homeLatitude : row.awayLatitude,
    longitude: home ? row.homeLongitude : row.awayLongitude,
  };
}

function mapMatch(row: MatchListRow): MatchViewModel {
  return {
    id: row.id,
    date: serializeDate(row.date),
    status: row.status,
    home: mapTeam(row, 'home'),
    away: mapTeam(row, 'away'),
  };
}

export function mapMatchRowsToRounds(rows: MatchListRow[]): MatchRoundViewModel[] {
  const grouped = new Map<number, MatchRoundViewModel>();

  for (const row of rows) {
    if (row.roundId == null) continue;
    const existing = grouped.get(row.roundId);
    if (existing) {
      existing.matches.push(mapMatch(row));
      continue;
    }

    grouped.set(row.roundId, {
      roundId: row.roundId,
      roundName: row.roundName || `Jornada ${row.roundId}`,
      roundIndex: 0,
      matches: [mapMatch(row)],
    });
  }

  return Array.from(grouped.values())
    .sort((left, right) => left.roundId - right.roundId)
    .map((round, index) => ({ ...round, roundIndex: index + 1 }));
}

export function mapMatchRowsToSchedule(rows: MatchListRow[]): MatchScheduleViewModel[] {
  return rows.map((row) => ({ ...mapMatch(row), roundName: row.roundName || '' }));
}

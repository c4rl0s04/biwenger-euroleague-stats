import type { RoundDetails, RoundFixture } from '../../models/round-details';

const date = (value: Date | string | null): string | null =>
  value instanceof Date ? value.toJSON() : value;
export function mapRoundDetails(
  info: {
    round_id: number | null;
    round_name: string | null;
    start_date: Date | string | null;
    end_date: Date | string | null;
  },
  fixtures: Array<
    Omit<RoundFixture, 'date' | 'home_position' | 'away_position'> & { date: Date | string | null }
  >,
  positions: Map<number, number>
): RoundDetails {
  return {
    round_id: info.round_id,
    round_name: info.round_name,
    start_date: date(info.start_date),
    end_date: date(info.end_date),
    matches: fixtures.map((row) => ({
      home_id: row.home_id,
      away_id: row.away_id,
      home_team: row.home_team,
      away_team: row.away_team,
      date: date(row.date),
      status: row.status,
      home_score: row.home_score,
      away_score: row.away_score,
      home_logo: row.home_logo,
      home_short: row.home_short,
      away_logo: row.away_logo,
      away_short: row.away_short,
      home_position: positions.get(row.home_id!) || null,
      away_position: positions.get(row.away_id!) || null,
    })),
  };
}

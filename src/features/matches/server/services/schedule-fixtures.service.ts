import 'server-only';
import * as queries from '../queries/schedule-fixtures.query';
import type { ScheduleRoundOption, ScheduleFixture } from '../../models/schedule-fixture';

export const SCHEDULE_FIXTURES_POLICY = {
  access: 'public fantasy fixtures',
  serverCache: 'none',
} as const;

export function createScheduleFixturesService(deps = queries) {
  const mapRound = (row: {
    round_id: number | null;
    round_name: string | null;
  }): ScheduleRoundOption => ({
    roundId: row.round_id,
    roundName: row.round_name,
  });
  return {
    async getScheduleRoundOptions(): Promise<ScheduleRoundOption[]> {
      return (await deps.getScheduleRounds()).map((row) => ({
        ...mapRound(row),
        firstMatchDate: row.min_date?.toISOString() ?? null,
      }));
    },
    async findScheduleRound(id: number): Promise<ScheduleRoundOption | null> {
      const row = await deps.getRoundById(id);
      return row ? mapRound(row) : null;
    },
    async getLatestDatedScheduleRound(): Promise<ScheduleRoundOption | null> {
      const row = await deps.getLastRound();
      return row ? mapRound(row) : null;
    },
    async getScheduleFixtures(id: number): Promise<ScheduleFixture[]> {
      return (await deps.fetchMatchesForRound(id)).map((row) => ({
        id: row.match_id,
        date: row.date?.toISOString() ?? null,
        homeId: row.home_id,
        awayId: row.away_id,
        homeName: row.home_team,
        awayName: row.away_team,
        homeCode: row.home_code,
        awayCode: row.away_code,
      }));
    },
  };
}
export const {
  getScheduleRoundOptions,
  findScheduleRound,
  getLatestDatedScheduleRound,
  getScheduleFixtures,
} = createScheduleFixturesService();

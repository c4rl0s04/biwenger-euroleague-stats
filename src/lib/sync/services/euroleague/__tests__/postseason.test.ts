import { describe, expect, it, vi } from 'vitest';
import { syncOfficialPostseason } from '../postseason';
import { fixtureManager, fixtureProvider, reportRows, scheduleRows } from './postseason-fixtures';

function fakeDb(pendingGameCodes: number[] = []) {
  return {
    query: vi.fn(async (sql: string) =>
      sql.trim().startsWith('SELECT')
        ? { rows: pendingGameCodes.map((game_code) => ({ game_code })), rowCount: 0 }
        : { rows: [], rowCount: 1 }
    ),
  };
}

describe('syncOfficialPostseason', () => {
  it('fails on an unknown phase before writing anything', async () => {
    const schedule = [...scheduleRows, { ...scheduleRows[4], game: '999', round: 'QF' }];
    const { provider } = fixtureProvider(schedule);
    const db = fakeDb();

    await expect(syncOfficialPostseason(fixtureManager(db, provider))).rejects.toThrow(
      /Unknown EuroLeague phase: round "QF"/
    );
    expect(db.query).not.toHaveBeenCalled();
  });

  it('reuses the schedule already loaded by master data', async () => {
    const { provider } = fixtureProvider();
    const schedule = await provider.getSchedule(2025);
    const getSchedule = vi.spyOn(provider, 'getSchedule');
    const manager = fixtureManager(fakeDb(), provider);
    manager.context.officialSchedule = schedule;

    const counts = await syncOfficialPostseason(manager);

    expect(getSchedule).not.toHaveBeenCalled();
    expect(counts).toMatchObject({ games: 23, changed: 23, RS: 1, PI: 3, PO: 16, FF: 3 });
  });

  it('rejects a report whose teams do not match the schedule', async () => {
    const { provider } = fixtureProvider();
    const original = reportRows.find((row) => row.Gamecode === 406)!;
    vi.spyOn(provider, 'getGameReport').mockResolvedValue({
      gameCode: 406,
      roundNumber: 47,
      phase: 'FF',
      homeTeamCode: String(original['road.club.code']),
      awayTeamCode: String(original['local.club.code']),
      homeScore: 1,
      awayScore: 2,
      scheduledAt: null,
      isPlayed: true,
      homeCrestUrl: null,
      awayCrestUrl: null,
      raw: {},
    });

    await expect(syncOfficialPostseason(fixtureManager(fakeDb([406]), provider))).rejects.toThrow(
      /406 report teams do not match/
    );
  });

  it('counts reports without a final score as unavailable', async () => {
    const { provider } = fixtureProvider();
    vi.spyOn(provider, 'getGameReport').mockResolvedValue(null);
    const db = fakeDb([404]);

    const counts = await syncOfficialPostseason(fixtureManager(db, provider));

    expect(counts).toMatchObject({ scored: 0, unavailable: 1 });
    expect(db.query.mock.calls.some(([sql]) => String(sql).includes('SET home_score'))).toBe(false);
  });
});

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { EuroleagueAdvancedProvider } from '../euroleague-advanced-client';

const fixture = (name: string) =>
  JSON.parse(
    readFileSync(
      fileURLToPath(new URL(`../__fixtures__/advanced/${name}.json`, import.meta.url)),
      'utf8'
    )
  );

const response = (body: unknown, status = 200) =>
  new Response(status === 404 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('EuroleagueAdvancedProvider contracts', () => {
  it('normalizes every free granular response used by the sync', async () => {
    const fetchImpl = vi.fn(async (url: URL | RequestInfo) => {
      const path = new URL(String(url)).pathname;
      if (path.endsWith('/schedule')) return response(fixture('schedule'));
      if (path.endsWith('/standings')) return response(fixture('standings'));
      if (path.endsWith('/players/season')) return response([]);
      if (path.endsWith('/games/report/game')) return response(fixture('report'));
      if (path.endsWith('/games/metadata/game')) return response(fixture('metadata'));
      if (path.endsWith('/boxscore/players/game')) return response(fixture('boxscore'));
      if (path.endsWith('/play-by-play/game')) return response(fixture('play-by-play'));
      return response(fixture('shots'));
    });
    const provider = new EuroleagueAdvancedProvider({ fetchImpl: fetchImpl as typeof fetch });

    await expect(provider.getSchedule(2026)).resolves.toMatchObject([
      { seasonYear: 2026, gameCode: 1, homeTeamCode: 'MAD' },
    ]);
    await expect(provider.getStandings(2026, 1)).resolves.toHaveLength(1);
    await expect(provider.getPlayerProfiles(2026)).resolves.toEqual([]);
    await expect(provider.getGameReport(2026, 1)).resolves.toMatchObject({ homeScore: 88 });
    await expect(provider.getGameMetadata(2026, 1)).resolves.toMatchObject({
      homeQuarterScores: [20, 22, 23, 23],
    });
    await expect(provider.getPlayerBoxScore(2026, 1)).resolves.toMatchObject([
      { playerCode: 'P014102', offensiveRebounds: 2, plusMinus: 7 },
    ]);
    await expect(provider.getPlayByPlay(2026, 1)).resolves.toMatchObject([{ sequence: 4 }]);
    await expect(provider.getShots(2026, 1)).resolves.toMatchObject([
      { annotationNumber: 4, isFastbreak: false },
    ]);
  });

  it('accepts future-game 404s as unavailable data', async () => {
    const provider = new EuroleagueAdvancedProvider({
      fetchImpl: vi.fn(async () => response(null, 404)) as unknown as typeof fetch,
    });
    await expect(provider.getGameMetadata(2026, 380)).resolves.toBeNull();
    await expect(provider.getPlayerBoxScore(2026, 380)).resolves.toEqual([]);
  });

  it('retries throttling and sends an optional bearer token', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response([], 429))
      .mockResolvedValueOnce(response(fixture('schedule')));
    const provider = new EuroleagueAdvancedProvider({
      token: 'test-token',
      retries: 1,
      fetchImpl: fetchImpl as typeof fetch,
    });
    await expect(provider.getSchedule(2026)).resolves.toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][1]?.headers).toEqual({ Authorization: 'Bearer test-token' });
  });
});

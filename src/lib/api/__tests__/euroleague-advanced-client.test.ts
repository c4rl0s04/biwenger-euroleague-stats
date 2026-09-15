import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  EuroleagueApiError,
  EuroleagueClient,
  parseMinutes,
  parseProviderNumber,
} from '../euroleague/client';

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

describe('EuroleagueClient contracts', () => {
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
    const provider = new EuroleagueClient({ fetchImpl: fetchImpl as typeof fetch });

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
    const provider = new EuroleagueClient({
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
    const provider = new EuroleagueClient({
      token: 'test-token',
      retries: 1,
      fetchImpl: fetchImpl as typeof fetch,
    });
    await expect(provider.getSchedule(2026)).resolves.toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][1]?.headers).toEqual({ Authorization: 'Bearer test-token' });
  });

  it('rejects a missing master-data endpoint and malformed provider rows', async () => {
    const missing = new EuroleagueClient({
      fetchImpl: vi.fn(async () => response(null, 404)) as unknown as typeof fetch,
    });
    await expect(missing.getSchedule(2026)).rejects.toBeInstanceOf(EuroleagueApiError);

    const malformed = new EuroleagueClient({
      fetchImpl: vi.fn(async () => response([{ game: 1 }])) as unknown as typeof fetch,
    });
    await expect(malformed.getSchedule(2026)).rejects.toMatchObject({ name: 'ZodError' });
  });

  describe('parseMinutes', () => {
    it('parses valid MM:SS duration into seconds', () => {
      expect(parseMinutes('12:34')).toEqual({ raw: '12:34', seconds: 754, isDnp: false });
      expect(parseMinutes('00:00')).toEqual({ raw: '00:00', seconds: 0, isDnp: false });
      expect(parseMinutes('05:20')).toEqual({ raw: '05:20', seconds: 320, isDnp: false });
    });

    it('distinguishes DNP as non-participation without inferring 0 seconds', () => {
      expect(parseMinutes('DNP')).toEqual({ raw: 'DNP', seconds: null, isDnp: true });
      expect(parseMinutes('DNE')).toEqual({ raw: 'DNE', seconds: null, isDnp: true });
      expect(parseMinutes('CDNP')).toEqual({ raw: 'CDNP', seconds: null, isDnp: true });
    });

    it('returns nulls for absent or empty minutes without marking DNP', () => {
      expect(parseMinutes(null)).toEqual({ raw: null, seconds: null, isDnp: false });
      expect(parseMinutes(undefined)).toEqual({ raw: null, seconds: null, isDnp: false });
      expect(parseMinutes('')).toEqual({ raw: null, seconds: null, isDnp: false });
      expect(parseMinutes('   ')).toEqual({ raw: null, seconds: null, isDnp: false });
    });

    it('throws error for malformed minutes strings', () => {
      expect(() => parseMinutes('invalid')).toThrow('Invalid minutes format');
      expect(() => parseMinutes('12:65')).toThrow('Invalid minutes format');
      expect(() => parseMinutes('12')).toThrow('Invalid minutes format');
    });
  });

  describe('parseProviderNumber', () => {
    it('preserves real zero as 0', () => {
      expect(parseProviderNumber(0, 'Points')).toBe(0);
      expect(parseProviderNumber('0', 'Points')).toBe(0);
    });

    it('returns null for absent, undefined, or empty values', () => {
      expect(parseProviderNumber(null, 'Points')).toBeNull();
      expect(parseProviderNumber(undefined, 'Points')).toBeNull();
      expect(parseProviderNumber('', 'Points')).toBeNull();
    });

    it('throws error for malformed non-numeric values', () => {
      expect(() => parseProviderNumber('abc', 'Points')).toThrow(
        'Invalid numeric value for Points'
      );
    });
  });

  describe('getPlayerBoxScore missing value preservation', () => {
    it('preserves null when sporting metrics are absent rather than coercing to 0', async () => {
      const boxscoreRow = {
        Player_ID: '14102',
        Player: 'JONES, KAI',
        Team: 'MAD',
        Minutes: 'DNP',
        Points: 0,
        FieldGoalsMade2: null,
        Assistances: undefined,
      };
      const provider = new EuroleagueClient({
        fetchImpl: vi.fn(async () => response([boxscoreRow])) as unknown as typeof fetch,
      });

      const result = await provider.getPlayerBoxScore(2026, 1);
      expect(result).toHaveLength(1);
      const player = result[0];
      expect(player.minutes).toBe('DNP');
      expect(player.minutesSeconds).toBeNull();
      expect(player.isDnp).toBe(true);
      expect(player.points).toBe(0); // Real 0 preserved
      expect(player.twoPointsMade).toBeNull(); // Missing preserved as null
      expect(player.assists).toBeNull(); // Missing preserved as null
    });
  });
});

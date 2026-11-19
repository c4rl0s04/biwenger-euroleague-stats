import { expect, it, vi } from 'vitest';
import { parseBiwengerRoundGames, readBiwengerRoundGames } from '../round-games';
import { biwengerProviderClient } from '../client';

vi.mock('../client', () => ({ biwengerProviderClient: { query: vi.fn() } }));

const games = [
  {
    id: 42,
    date: '1790793000',
    home: { id: 10, reports: [{ player: { id: 1 }, points: 0 }] },
    away: { id: 20, reports: { '2': { player: { id: 2 }, points: -3 } } },
  },
];

it.each([{ data: { games } }, { games }])('decodes a supported round response', (payload) => {
  expect(parseBiwengerRoundGames(payload)).toEqual(games);
});

it('keeps empty data distinct from missing games', () => {
  expect(parseBiwengerRoundGames({ data: { games: [] } })).toEqual([]);
  expect(() => parseBiwengerRoundGames({ data: {} })).toThrow('Invalid Biwenger round games');
});

it.each([
  null,
  { games: [{}, null] },
  { games: [{ home: { reports: 17 } }] },
  { games: [{ home: { id: '10' } }] },
])('rejects malformed round data before passing it to the sync', (payload) => {
  expect(() => parseBiwengerRoundGames(payload)).toThrow('Invalid Biwenger round games');
});

it('uses the configured round endpoint through the shared provider client', async () => {
  vi.mocked(biwengerProviderClient.query).mockResolvedValueOnce({ data: { games } });
  await expect(readBiwengerRoundGames(5145)).resolves.toEqual(games);
  expect(biwengerProviderClient.query).toHaveBeenCalledWith('/rounds/euroleague/5145?score=1');
});

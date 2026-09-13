import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('../../index', () => ({ db: {}, pgClient: { query: mocks.query } }));
vi.mock('../../season-context', () => ({ resolveReadSeasonId: mocks.season }));
import {
  getPorrasStats,
  getAchievements,
  getParticipation,
  getPerformanceData,
  getTableStats,
  getClutchStats,
  getVictorias,
  getBestRoundStat,
  getHistoryPivot,
  type NormalizedPrediction,
} from './predictions';

const entry = (patch: Partial<NormalizedPrediction> = {}): NormalizedPrediction => ({
  user_id: '1',
  usuario: 'Ana',
  user_icon: 'icon',
  color_index: 2,
  jornada: 'Jornada 1',
  base_round_id: 1,
  aciertos: 8,
  result: '1-2',
  is_partial: false,
  total_matches: 10,
  user_matches: 10,
  ...patch,
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.season.mockResolvedValue('2026-27');
  mocks.query.mockResolvedValue({ rows: [] });
});

it('keeps two separately season-scoped reads per request without caching', async () => {
  const result = await getPorrasStats();
  expect(result).toEqual({
    achievements: { perfect_10: [], blanked: [] },
    participation: [],
    table_stats: [],
    performance: [],
    history: { users: [], jornadas: [] },
    clutch_stats: [],
    porra_stats: { victorias: [], predictable_teams: [], promedios: [], mejor_jornada: [] },
  });
  expect(result.porra_stats.promedios).toBe(result.table_stats);
  await getPorrasStats();
  expect(mocks.query).toHaveBeenCalledTimes(4);
  expect(mocks.season).toHaveBeenCalledTimes(4);
  expect(mocks.query.mock.calls.map((call) => call[1])).toEqual(Array(4).fill(['2026-27']));
  expect(mocks.query.mock.calls[0][0]).toContain('FROM conceptual_totals');
  expect(mocks.query.mock.calls[1][0]).toContain('WITH MatchOutcomes');
});

it('defines blanked as the minimum complete score, not necessarily zero', async () => {
  const result = await getAchievements([
    entry({ aciertos: 12 }),
    entry({ user_id: '2', aciertos: 4 }),
    entry({ user_id: '3', aciertos: 0, is_partial: true }),
  ]);
  expect(result.perfect_10.map((x) => x.aciertos)).toEqual([12]);
  expect(result.blanked.map((x) => x.aciertos)).toEqual([4]);
});

it('excludes partial rounds from ranking aggregates but retains first identity fields', async () => {
  const result = await getTableStats([
    entry({ is_partial: true, aciertos: 99, usuario: 'First' }),
    entry({ aciertos: 8 }),
    entry({ aciertos: 10, base_round_id: 2 }),
    entry({ user_id: '2', usuario: 'Other', is_partial: true }),
  ]);
  expect(result[0]).toMatchObject({
    usuario: 'First',
    jornadas_jugadas: 2,
    total_aciertos: 18,
    promedio: 9,
    mejor_jornada: 10,
    peor_jornada: 8,
    exacts: 2,
    perfects: 1,
  });
  expect(result[1]).toMatchObject({
    jornadas_jugadas: 0,
    promedio: 0,
    mejor_jornada: 0,
    peor_jornada: 0,
  });
});

it('counts all tied winners and excludes partial scores', async () => {
  const result = await getVictorias([
    entry(),
    entry({ user_id: '2', usuario: 'B' }),
    entry({ user_id: '3', aciertos: 99, is_partial: true }),
  ]);
  expect(result.map((x) => [x.user_id, x.victorias])).toEqual([
    [1, 1],
    [2, 1],
  ]);
});

it('selects the latest three conceptual rounds before excluding partial results', async () => {
  const data = [1, 2, 3, 4].map((id) =>
    entry({
      base_round_id: id,
      jornada: `Jornada ${id}`,
      aciertos: id,
      is_partial: id === 4,
    })
  );
  expect(await getClutchStats(data)).toMatchObject([{ avg_last_3: 2.5 }]);
  expect(await getParticipation(data)).toEqual(
    [1, 2, 3, 4].map((id) => ({
      jornada: `Jornada ${id}`,
      count: 1,
    }))
  );
});

it('preserves performance in-place sorting and latest-round tie breaking for best rounds', async () => {
  const data = [entry({ base_round_id: 2, jornada: 'Jornada 2' }), entry()];
  expect((await getPerformanceData(data)).map((x) => x.jornada)).toEqual([
    'Jornada 1',
    'Jornada 2',
  ]);
  expect(data.map((x) => x.base_round_id)).toEqual([1, 2]);
  expect((await getBestRoundStat(data)).map((x) => x.jornada)).toEqual(['Jornada 2', 'Jornada 1']);
});

it('pins the existing leading-zero history mismatch instead of silently correcting IDs', async () => {
  const result = await getHistoryPivot([entry({ user_id: '01' })]);
  expect(result.users[0].id).toBe(1);
  expect(result.jornadas[0].scores.Ana).toEqual({ score: null, is_partial: false });
});

it('propagates query and season failures without a fallback result', async () => {
  const failure = new Error('synthetic read failure');
  mocks.query.mockRejectedValueOnce(failure);
  await expect(getPorrasStats()).rejects.toBe(failure);
  mocks.season.mockRejectedValueOnce(failure);
  await expect(getPorrasStats()).rejects.toBe(failure);
});

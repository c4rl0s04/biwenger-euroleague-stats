import { expect, it } from 'vitest';
import { createAllPlayAllCalculation } from './all-play-all-calculation';
import { mapAllPlayAllEntry } from './mappers/all-play-all.mapper';

const user = (id: string) => ({ id, name: null, icon: null, color_index: 0 });

it('preserves pair wins, ties, losses, inactive exclusions and percentages', () => {
  const calculation = createAllPlayAllCalculation([user('1'), user('2'), user('3')]);
  calculation.addRound([
    { user_id: '1', points: 20 },
    { user_id: '2', points: 10 },
    { user_id: '3', points: 10 },
    { user_id: 'inactive', points: 99 },
  ]);
  expect(
    calculation
      .finish()
      .map(({ user_id, wins, losses, ties, pct }) => ({ user_id, wins, losses, ties, pct }))
  ).toEqual([
    { user_id: '1', wins: 2, losses: 0, ties: 0, pct: 100 },
    { user_id: '2', wins: 0, losses: 1, ties: 1, pct: 0 },
    { user_id: '3', wins: 0, losses: 1, ties: 1, pct: 0 },
  ]);
});
it('retains Object.values integer-key enumeration for tied records and NaN sort stability', () => {
  const calculation = createAllPlayAllCalculation([user('10'), user('2'), user('name'), user('1')]);
  expect(calculation.finish().map((row) => row.user_id)).toEqual(['1', '2', '10', 'name']);
  expect(calculation.finish().every((row) => Number.isNaN(row.pct))).toBe(true);
});
it('preserves null-point JavaScript comparison and duplicate-user pairs', () => {
  const calculation = createAllPlayAllCalculation([user('1'), user('2')]);
  calculation.addRound([
    { user_id: '1', points: null },
    { user_id: '2', points: -1 },
  ]);
  calculation.addRound([
    { user_id: '1', points: 0 },
    { user_id: '1', points: null },
  ]);
  expect(calculation.finish().find((row) => row.user_id === '1')).toMatchObject({
    wins: 1,
    losses: 0,
    ties: 2,
    pct: (1 / 3) * 100,
  });
});
it('returns empty output for empty participants and allowlists serializable cache hits', () => {
  expect(createAllPlayAllCalculation([]).finish()).toEqual([]);
  const raw = {
    user_id: '1',
    name: null,
    icon: null,
    color_index: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    pct: NaN,
    forbiddenField: 'excluded',
  };
  const mapped = mapAllPlayAllEntry(raw);
  expect(mapped).toEqual({
    user_id: '1',
    name: null,
    icon: null,
    color_index: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    pct: null,
  });
  expect(JSON.stringify(mapped)).toBe(JSON.stringify({ ...raw, forbiddenField: undefined }));
});

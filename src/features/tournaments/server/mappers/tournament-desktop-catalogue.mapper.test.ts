import { expect, it } from 'vitest';
import type { Tournament, TournamentJson } from '../../models/tournaments';
import { mapDesktopTournamentCatalogue } from './tournament-catalogue.mapper';

const row = (data: TournamentJson, status = 'finished'): Tournament => ({
  id: 7,
  name: 'Cup',
  type: 'playoff',
  status,
  data_json: JSON.stringify(data),
  data,
});
const project = (data: TournamentJson, status = 'finished') =>
  mapDesktopTournamentCatalogue({ active: [], finished: [row(data, status)] }).finished[0];

it.each(['semi-final', ['Round', 2], true, 3, null, false, 0, ''])(
  'preserves active phase display and fallback: %j',
  (phase) => {
    expect(project({ currentPhase: phase, winner: { icon: 12, name: {} } }, 'active')).toEqual({
      id: 7,
      name: 'Cup',
      type: 'playoff',
      status: 'active',
      statusLabel: phase || 'En Curso',
      winner: null,
    });
  }
);

it.each([null, false, 0, '', true, 1, 'historic', [], {}])(
  'preserves winner banner presence: %j',
  (winner) => {
    const result = project({ winner, currentPhase: { unused: true } });
    expect(result.winner).toEqual(winner ? { name: null, iconUrl: null } : null);
    expect(result.statusLabel).toBe('Finalizado');
  }
);

it.each([
  ['icons/7.png', 'https://cdn.biwenger.com/icons/7.png'],
  ['http://example.test/a', 'http://example.test/a'],
  ['https://example.test/a', 'https://example.test/a'],
  ['HTTP://example.test/a', 'https://cdn.biwenger.com/HTTP://example.test/a'],
  ['', null],
  [null, null],
  [false, null],
  [0, null],
])('retains icon resolution for %j', (icon, expected) => {
  expect(project({ winner: { name: 'Ana', icon } }).winner).toEqual({
    name: 'Ana',
    iconUrl: expected,
  });
});

it('allowlists fields without mutating or forwarding historical JSON', () => {
  const data = {
    winner: { name: ['Ana', 7], icon: 'icons/7.png', id: { unused: true } },
    config: { arbitrary: true },
    rounds: false,
  };
  const before = JSON.stringify(data);
  const result = project(data);
  expect(JSON.stringify(data)).toBe(before);
  expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  expect(Object.keys(result)).toEqual(['id', 'name', 'type', 'status', 'statusLabel', 'winner']);
  expect(result.winner).toEqual({
    name: ['Ana', 7],
    iconUrl: 'https://cdn.biwenger.com/icons/7.png',
  });
});

it('keeps formerly failing consumed values on the error path', () => {
  expect(() => project({ currentPhase: {} }, 'active')).toThrow(TypeError);
  expect(() => project({ winner: { name: {} } })).toThrow(TypeError);
  expect(() => project({ winner: { name: 'Ana', icon: 12 } })).toThrow(TypeError);
});

it('keeps list order, duplicates and empties', () => {
  expect(mapDesktopTournamentCatalogue({ active: [], finished: [] })).toEqual({
    active: [],
    finished: [],
  });
  const a = row(null);
  const b = { ...a, id: 8 };
  expect(
    mapDesktopTournamentCatalogue({ active: [], finished: [b, a, b] }).finished.map((x) => x.id)
  ).toEqual([8, 7, 8]);
});

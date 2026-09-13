import { expect, it } from 'vitest';
import type { Tournament, TournamentJson } from '../../models/tournaments';
import { mapTournamentCatalogue } from './tournament-catalogue.mapper';

const row = (data: TournamentJson): Tournament => ({
  id: 7,
  name: null,
  type: 'league',
  status: 'finished',
  data_json: JSON.stringify(data),
  data,
});

it.each([null, false, 0, '', 'Ana', true, 12, [], ['Ana', 'Luis'], { custom: 'value' }])(
  'preserves the former winner label conversion for %j',
  (name) => {
    const result = mapTournamentCatalogue({ active: [], finished: [row({ winner: { name } })] });
    expect(result.finished).toEqual([
      {
        id: 7,
        name: null,
        type: 'league',
        winnerLabel: name ? `Campeón: ${name}` : 'Finalizado',
      },
    ]);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(result.finished[0]).not.toHaveProperty('data');
    expect(result.finished[0]).not.toHaveProperty('data_json');
  }
);

it.each([null, false, 0, 'history', [], { unrelated: ['ignored'] }])(
  'accepts historical snapshot roots without leaking them: %j',
  (snapshot) => {
    expect(
      mapTournamentCatalogue({ active: [], finished: [row(snapshot)] }).finished[0].winnerLabel
    ).toBe('Finalizado');
  }
);

it('ignores unused malformed fields and never reads active winner names', () => {
  const snapshot = { winner: { name: { toString: null }, icon: 12 }, rounds: false };
  expect(
    mapTournamentCatalogue({ active: [row(snapshot)], finished: [] }).active[0].winnerLabel
  ).toBe('Finalizado');
  expect(
    mapTournamentCatalogue({
      active: [],
      finished: [row({ ...snapshot, winner: { name: 'Ana', icon: 12 } })],
    }).finished[0].winnerLabel
  ).toBe('Campeón: Ana');
  // This consumed value already failed template interpolation in the original screen.
  expect(() => mapTournamentCatalogue({ active: [], finished: [row(snapshot)] })).toThrow(
    TypeError
  );
});

it('preserves list order, duplicates and empty lists', () => {
  const first = row(null);
  const second = { ...row(null), id: 8 };
  expect(mapTournamentCatalogue({ active: [], finished: [] })).toEqual({
    active: [],
    finished: [],
  });
  expect(
    mapTournamentCatalogue({ active: [second, first, second], finished: [] }).active.map(
      (x) => x.id
    )
  ).toEqual([8, 7, 8]);
});

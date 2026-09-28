import { describe, expect, it } from 'vitest';
import type { PlayerCatalogueItemViewModel } from '@/features/players/public';
import { mapManagerOptions, mapPlayerOptions } from './options';

describe('season prediction options', () => {
  it('maps season player records to compact, alphabetized choices', () => {
    const players = [
      {
        id: 2,
        name: 'Žiga Longname',
        team_name: 'Madrid',
        position: '1',
        img: '/z.png',
        price: 900,
      },
      { id: 1, name: 'Álex', team_name: 'Paris', position: '', img: '', price: 800 },
    ] as PlayerCatalogueItemViewModel[];

    expect(mapPlayerOptions(players)).toEqual([
      { id: '1', name: 'Álex', detail: 'Paris', image: null },
      { id: '2', name: 'Žiga Longname', detail: 'Madrid · Base', image: '/z.png' },
    ]);
  });

  it('maps manager identities without exposing account fields', () => {
    expect(
      mapManagerOptions([
        { id: 'b', name: null, icon: null, color_index: 1 },
        { id: 'a', name: 'Ana', icon: '/a.png', color_index: 2 },
      ])
    ).toEqual([
      { id: 'a', name: 'Ana', image: '/a.png' },
      { id: 'b', name: 'Mánager b', image: null },
    ]);
  });
});

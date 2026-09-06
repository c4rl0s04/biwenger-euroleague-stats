import { describe, expect, it } from 'vitest';
import { mapSearchResults } from './search.mapper';

describe('search mapper', () => {
  it('allowlists exact legacy fields, text manager IDs and nulls without reordering', () => {
    const rows = {
      players: [
        {
          id: 2,
          name: 'B',
          img: 'b.png',
          position: null,
          team: null,
          price: '12.5',
          points: null,
          privateExtra: 'excluded',
        },
        { id: 1, name: 'A', img: 'a.png', position: '1', team: 'Club', price: 42, points: '0x10' },
      ],
      teams: [{ id: 3, name: 'Club', player_count: '12', privateExtra: 'excluded' }],
      users: [{ id: '007', name: 'Manager', icon: null, privateExtra: 'excluded' }],
    };
    const result = mapSearchResults(rows);
    expect(result.players[0].points).toBeNaN();
    expect(JSON.parse(JSON.stringify(result))).toEqual({
      players: [
        { id: 2, name: 'B', img: 'b.png', position: null, team: null, price: 12, points: null },
        { id: 1, name: 'A', img: 'a.png', position: '1', team: 'Club', price: 42, points: 16 },
      ],
      teams: [{ id: 3, name: 'Club', player_count: 12 }],
      users: [{ id: '007', name: 'Manager', icon: null }],
    });
    expect(result.users[0]).not.toBe(rows.users[0]);
  });

  it('returns independent empty collections', () => {
    const rows = { players: [], teams: [], users: [] };
    expect(mapSearchResults(rows)).toEqual(rows);
    expect(mapSearchResults(rows).players).not.toBe(rows.players);
  });
});

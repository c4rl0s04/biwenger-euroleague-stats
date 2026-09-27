import type { ScheduleMatch } from '@/features/schedule/public';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { buildAutoLineup, type AutoAlignPlayer, type AutoAlignMatch } from './auto-lineup';
import { calculateSquadFormAverage, enrichLineupSquad, rankSwapCandidates } from './squad';

describe('automatic lineup compatibility', () => {
  it('accepts the real Schedule contract, including null dates', () => {
    expectTypeOf<ScheduleMatch>().toExtend<AutoAlignMatch<AutoAlignPlayer>>();
    const result = buildAutoLineup([
      {
        date: '2026-09-01',
        user_players: [
          { id: 4, position: 'Pivot' },
          { id: 5, position: 'Alero' },
          { id: 6, position: 'Base' },
        ],
      },
      {
        date: null,
        user_players: [
          { id: 1, position: 'Base' },
          { id: 2, position: 'Base' },
          { id: 3, position: 'Alero' },
        ],
      },
    ]);
    expect(result.lineupPayload.playersID).toEqual([1, 2, 3, 5, 4, 6]);
    expect(
      result.starters.filter((p) => p.id === 1 || p.id === 2 || p.id === 3).map((p) => p.matchDate)
    ).toEqual([0, 0, 0]);
  });

  it('orders starters by role, limits roles to three, picks captain and keeps earliest bench order', () => {
    const players = Array.from({ length: 12 }, (_, i) => ({
      id: i === 0 ? '0' : i,
      position: i < 5 ? 'Guard' : i < 7 ? 'Forward' : 'Center',
      puntos: i,
    }));
    const result = buildAutoLineup([{ date: '2026-09-01', user_players: players }]);
    expect(result.lineupPayload).toEqual({
      type: '3-2-0',
      playersID: ['0', 1, 2, 5, 6, 3, 4, 7, 8, 9],
      reservesID: [],
      captain: 6,
    });
    expect(players).toHaveLength(12);
  });
  it('uses dates before points and keeps default/Spanish position normalization', () => {
    const result = buildAutoLineup<AutoAlignPlayer>([
      { date: '2026-09-03', user_players: [{ id: 6, position: 'Center', puntos: 999 }] },
      {
        date: '2026-09-01',
        user_players: [
          { id: 1 },
          { id: 2, position: 'Base' },
          { id: 3, position: 'Alero' },
          { id: 4, position: 'Pivot' },
          { id: 5, position: 'Forward' },
        ],
      },
    ]);
    expect(result.lineupPayload.playersID).toEqual([1, 2, 3, 5, 4, 6]);
    expect(result.captain.id).toBe(1);
  });
  it('preserves empty and insufficient squad errors', () => {
    expect(() => buildAutoLineup([])).toThrow('No tienes jugadores que jueguen en esta jornada.');
    expect(() => buildAutoLineup([{ date: '2026-09-01', user_players: [{ id: 1 }] }])).toThrow(
      'Faltan 4 posiciones'
    );
  });
});

describe('squad presentation domain rules', () => {
  it('ranks active eligible swaps first without mutating the squad', () => {
    const squad = [
      { id: 1, position: 'Base', points: 4 },
      { id: '2', position: 'Base', average: 100 },
      { id: 3, position: 'Base' },
      { id: 4, position: 'Pivot', average: 999 },
    ];
    expect(rankSwapCandidates(squad, squad[0], true, new Set(['3'])).map((p) => p.id)).toEqual([
      3,
      '2',
    ]);
    expect(rankSwapCandidates(squad, squad[0], false, new Set()).map((p) => p.id)).toEqual([
      4,
      '2',
      3,
    ]);
    expect(squad.map((p) => p.id)).toEqual([1, '2', 3, 4]);
  });
  it('preserves zero, DNP, empty and unknown squad-table form semantics', () => {
    expect(calculateSquadFormAverage('0,X,10')).toBe(5);
    expect(calculateSquadFormAverage('X')).toBe(0);
    expect(calculateSquadFormAverage(null)).toBe(0);
    expect(calculateSquadFormAverage('?,10')).toBeNaN();
  });
  it('merges listing fallbacks, offers and ownership across numeric/string ids', () => {
    const offer = { id: 99, requestedPlayers: ['1', 2] };
    expect(
      enrichLineupSquad([{ id: 1 }, { id: '2' }, { id: 3 }], {
        lineup: null,
        players: [{ id: '1', owner: { price: 42 } }],
        market: [
          { player: { id: 1 }, price: 12 },
          { id: 2, price: 0 },
        ],
        offers: [offer],
      })
    ).toEqual([
      { id: 1, isOnSale: true, listingPrice: 12, offers: [offer], owner: { price: 42 } },
      { id: '2', isOnSale: true, listingPrice: null, offers: [offer], owner: null },
      { id: 3, isOnSale: false, listingPrice: null, offers: [], owner: null },
    ]);
    expect(enrichLineupSquad([{ id: 1 }], null)[0].isOnSale).toBe(false);
  });
});

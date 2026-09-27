import { describe, expect, it } from 'vitest';
import { deriveRotation, normalizeLineupConfig, performSwap, realignTactics } from './lineup';

describe('lineup rules', () => {
  it('normalizes identifiers and preserves the existing captain/default formation semantics', () => {
    expect(normalizeLineupConfig({ playersID: [1, '2'], captain: { id: 2 } })).toEqual({
      playersID: ['1', '2'],
      reservesID: [],
      captain: '2',
      type: '2-2-1',
    });
    expect(normalizeLineupConfig({ captain: 0 }).captain).toBeNull();
    expect(normalizeLineupConfig()).toEqual({
      playersID: [],
      reservesID: [],
      captain: null,
      type: '2-2-1',
    });
  });
  it('swaps active players and transfers captaincy without mutating the input', () => {
    const config = { playersID: [1, '2'], reservesID: [3], captain: 1, type: '2-2-1' };
    expect(performSwap('1', 2, config)).toEqual({
      ...config,
      playersID: ['2', '1'],
      reservesID: ['3'],
      captain: '2',
    });
    expect(config.playersID).toEqual([1, '2']);
    expect(performSwap(99, 2, config)).toBe(config);
  });
  it('promotes a reserve, returns the old player and deduplicates identifiers', () => {
    expect(performSwap(1, 3, { playersID: [1, 2, 2], reservesID: [3, 4, 4], captain: 2 })).toEqual({
      playersID: ['3', '2'],
      reservesID: ['4', '1'],
      captain: 2,
    });
  });
  it('realigns starters by position, uses the bench first and keeps five bench players', () => {
    const positions = [
      'Base',
      'Base',
      'Base',
      'Alero',
      'Pivot',
      'Alero',
      'Base',
      'Alero',
      'Pivot',
      'Pivot',
      'Base',
    ];
    const squad = positions.map((position, i) => ({ id: i + 1, position, average: 20 - i }));
    const result = realignTactics('2-2-1', squad, {
      playersID: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      captain: 1,
    });
    expect(result.playersID.slice(0, 5)).toEqual(['1', '2', '4', '6', '5']);
    expect(result.playersID).toHaveLength(10);
    expect(new Set(result.playersID).size).toBe(10);
    expect(result.reservesID).toEqual(['11']);
  });
  it('handles insufficient squads and missing selections without manufacturing players', () => {
    expect(realignTactics('2-2-1', [{ id: 1, position: 'Base' }], { playersID: [1, 999] })).toEqual(
      { playersID: ['1'], reservesID: [] }
    );
    const rotation = deriveRotation({ playersID: [1, 999, 2, 3, 4, 5], captain: '1' }, [
      { id: 1 },
      { id: 5 },
    ]);
    expect(rotation).toEqual({ starters: [{ id: 1, is_captain: true }], bench: [{ id: 5 }] });
    expect(deriveRotation({}, null)).toEqual({ starters: [], bench: [] });
  });
});

import { describe, expect, it } from 'vitest';
import { clearLineupSlot, formationPositions, lineupFingerprint, planReplacement } from './draft';
const squad = [
  'Base',
  'Base',
  'Alero',
  'Alero',
  'Pivot',
  'Alero',
  'Base',
  'Pivot',
  'Alero',
  'Base',
  'Alero',
  'Pivot',
].map((position, i) => ({ id: i + 1, position }));
const draft = {
  type: '2-2-1',
  playersID: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  reservesID: [null, 11, 12],
  captain: 1,
};
describe('lineup draft actions', () => {
  it.each([0, 2, 4, 5, 9])('clears exact slot %i without shifting players', (index) => {
    const result = clearLineupSlot(draft, index);
    expect(result.playersID).toEqual(
      draft.playersID.map((id, i) => (i === index ? null : String(id)))
    );
    expect(result.reservesID).toEqual([String(draft.playersID[index]), '11', '12']);
    expect(result.captain).toBe(index === 0 ? null : '1');
    expect(draft.playersID[index]).not.toBeNull();
  });
  it('preserves multiple intentional gaps on a same-position replacement', () => {
    const result = planReplacement(
      { ...draft, playersID: [1, null, null, 4, 5, 6, 7, 8, 9, 10] },
      3,
      11,
      squad
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lineup.playersID).toEqual(['1', null, null, '11', '5', '6', '7', '8', '9', '10']);
    expect(result.formationChanged).toBe(false);
  });
  it('replaces a guard with a forward without changing the other selected starters', () => {
    const result = planReplacement(draft, 1, 11, squad);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lineup.type).toBe('1-3-1');
    expect(result.lineup.playersID?.slice(0, 5)).toEqual(['1', '11', '3', '4', '5']);
    expect(result.lineup.playersID?.slice(5)).toEqual(['6', '7', '8', '9', '10']);
    expect(result.lineup.reservesID).toEqual([null, '2', '12']);
  });
  it('keeps composition and captain when exchanging existing starters', () => {
    const result = planReplacement(draft, 0, 3, squad);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lineup.type).toBe('2-2-1');
    expect(result.lineup.captain).toBe('1');
    expect(new Set(result.lineup.playersID)).toEqual(new Set(draft.playersID.map(String)));
  });
  it('moves a gap to the selected active bench player and clears a removed captain', () => {
    const result = planReplacement(clearLineupSlot(draft, 0), 0, 7, squad);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lineup.playersID?.[0]).toBe('7');
    expect(result.lineup.playersID?.[6]).toBeNull();
    expect(result.lineup.captain).toBeNull();
  });
  it('rejects a replacement requiring an unsupported formation or unknown position', () => {
    const full = { type: '1-3-1', playersID: [1, 3, 4, 6, 5] };
    expect(planReplacement(full, 0, 11, squad).ok).toBe(false);
    expect(planReplacement(draft, 0, 99, [...squad, { id: 99, position: '?' }]).ok).toBe(false);
    expect(planReplacement(draft, -1, 11, squad).ok).toBe(false);
    expect(formationPositions('4-1-0')).toEqual([]);
  });
  it('canonicalizes IDs and ignores timestamps for external-change detection', () => {
    expect(lineupFingerprint(draft)).toBe(
      lineupFingerprint({ ...draft, playersID: draft.playersID.map(String) })
    );
    expect(lineupFingerprint(draft)).not.toBe(lineupFingerprint(clearLineupSlot(draft, 0)));
  });
});

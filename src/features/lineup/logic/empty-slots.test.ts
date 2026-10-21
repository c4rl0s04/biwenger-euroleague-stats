import { expect, it } from 'vitest';
import { mapToSafeLineupResponse } from '../server/mappers/lineup-read.mapper';
import { deriveRotation, normalizeLineupConfig, performSwap } from './lineup';
import { validateLineupCommand } from '../validation/lineup-command.schema';

const ids = [1, 2, 3, null, 5, 6, 7, 8, 9, 10];
const squad = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11].map((id) => ({ id, name: `Player ${id}` }));

it('preserves the second Alero gap through provider mapping, normalization and rotation', () => {
  const mapped = mapToSafeLineupResponse({
    lineup: { type: '2-2-1', playersID: ids, reservesID: [null, 11, null] },
  });
  expect(mapped.lineup?.playersID).toEqual(ids);
  const config = normalizeLineupConfig(mapped.lineup);
  expect(config.playersID).toEqual(['1', '2', '3', null, '5', '6', '7', '8', '9', '10']);
  expect(config.reservesID).toEqual([null, '11', null]);
  const rotation = deriveRotation(config, squad);
  expect(rotation.starters.map((s) => s.player?.id ?? null)).toEqual([1, 2, 3, null, 5]);
  expect(rotation.starters[3]).toMatchObject({
    slotIndex: 3,
    position: 'Alero',
    playerId: null,
    player: null,
  });
  expect(rotation.bench.map((s) => s.player?.id)).toEqual([6, 7, 8, 9, 10]);
});

it.each([0, 4, 5, 9])('keeps a gap at slot %i without shifting its neighbours', (index) => {
  const slots = Array.from({ length: 10 }, (_, i) => (i === index ? null : i + 1));
  const rotation = deriveRotation({ playersID: slots, type: '2-2-1' }, squad);
  expect([...rotation.starters, ...rotation.bench].map((s) => s.playerId)).toEqual(slots);
});

it('distinguishes empty slots from unavailable player details', () => {
  const rotation = deriveRotation({ playersID: [1, null, 999], type: '2-2-1' }, squad);
  expect(rotation.starters[1]).toMatchObject({ playerId: null, player: null });
  expect(rotation.starters[2]).toMatchObject({ playerId: 999, player: null });
});

it('fills one empty slot from a reserve, preserving other nulls and captaincy', () => {
  const config = { playersID: ids, reservesID: [null, 11, null], captain: 1, type: '2-2-1' };
  const result = performSwap({ slotIndex: 3 }, 11, config);
  expect(result.playersID).toEqual(['1', '2', '3', '11', '5', '6', '7', '8', '9', '10']);
  expect(result.reservesID).toEqual([null, null, null]);
  expect(result.captain).toBe(1);
  expect(config.playersID).toEqual(ids);
});

it('moves a bench player into the gap and leaves the vacated bench slot empty', () => {
  const result = performSwap({ slotIndex: 3 }, 6, { playersID: ids });
  expect(result.playersID).toEqual(['1', '2', '3', '6', '5', null, '7', '8', '9', '10']);
});

it('preserves multiple gaps when swapping unrelated players and saving', () => {
  const input = {
    playersID: [1, null, null, 4, 5, 6, null, 8, 9, 10],
    reservesID: [null, null],
    captain: 1,
  };
  const swapped = performSwap(1, 4, input);
  expect(swapped.playersID).toEqual(['4', null, null, '1', '5', '6', null, '8', '9', '10']);
  expect(validateLineupCommand(swapped).playersID).toEqual(swapped.playersID);
});

it('accepts a missing lineup without stringifying null slots', () => {
  expect(normalizeLineupConfig(null).playersID).toEqual([]);
});

it('does not invent players or promote a bench player across an unfillable formation position', async () => {
  const { realignTactics } = await import('./lineup');
  const result = realignTactics(
    '2-2-1',
    [
      { id: 1, position: 'Base' },
      { id: 2, position: 'Base' },
      { id: 5, position: 'Pivot' },
      { id: 6, position: 'Pivot' },
    ],
    { playersID: [1, 2, null, null, 5, 6] }
  );
  expect(result.playersID.slice(0, 5)).toEqual(['1', '2', null, null, '5']);
  expect(result.playersID[5]).toBe('6');
});

it.each([-1, 10, 1.5])('ignores invalid slot index %i without changing the lineup', (slotIndex) => {
  const config = { playersID: ids };
  expect(performSwap({ slotIndex }, 11, config)).toBe(config);
});

it('handles absent or malformed formation counts without losing slot positions', () => {
  const rotation = deriveRotation({ type: 'broken', playersID: ids }, squad);
  expect(rotation.starters.map((slot) => slot.position)).toEqual([
    'Base',
    'Base',
    'Alero',
    'Alero',
    'Pivot',
  ]);
});

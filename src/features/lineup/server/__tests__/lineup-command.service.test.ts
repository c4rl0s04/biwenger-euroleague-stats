import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BiwengerNetworkError, executeUserProviderCommand } from '@/features/provider/server';
import { lineupCommandService } from '../services/lineup-command.service';
import { readWorkspacePlayers } from '../queries/workspace.query';
import { lineupFingerprint } from '../../logic/draft';

vi.mock('@/features/provider/server', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  executeUserProviderCommand: vi.fn(),
}));
vi.mock('../queries/workspace.query', () => ({ readWorkspacePlayers: vi.fn() }));
const lineup = {
  type: '2-2-1',
  playersID: [1, 2, 3, null, 5, 6, null, 8, 9, 10],
  reservesID: [null, 11, null],
  captain: 1,
};
const query = vi.fn();
const command = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  query.mockResolvedValue({
    data: { lineup, players: Array.from({ length: 11 }, (_, i) => ({ id: i + 1 })) },
  });
  command.mockResolvedValue({ status: 'completed', httpStatus: 200 });
  vi.mocked(readWorkspacePlayers).mockResolvedValue(
    ['Base', 'Base', 'Alero', 'Alero', 'Pivot'].map((position, i) => ({
      id: i + 1,
      position,
    })) as never
  );
  vi.mocked(executeUserProviderCommand).mockImplementation(async (userId, operation, run) => {
    expect(operation).toBe('lineup.update');
    return run({ query, command } as never, { token: 'synthetic-secret', userId });
  });
});
describe('safe lineup saves', () => {
  it('rechecks live ownership with no retries then sends exactly one mutation preserving gaps', async () => {
    await expect(
      lineupCommandService.updateLineup('actor', lineup, lineupFingerprint(lineup))
    ).resolves.toMatchObject({ status: 'completed' });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toMatchObject({
      retries: 0,
      cache: 'no-store',
      context: { userId: 'actor' },
    });
    expect(command).toHaveBeenCalledTimes(1);
    expect(command.mock.calls[0][1].body.lineup.playersID).toEqual(lineup.playersID);
    expect(command.mock.calls[0][1].body.lineup.reservesID).toEqual(lineup.reservesID);
    expect(query.mock.invocationCallOrder[0]).toBeLessThan(command.mock.invocationCallOrder[0]);
  });
  it.each(['starter', 'reserve'])('rejects a sold %s before any mutation', async (kind) => {
    query.mockResolvedValue({
      lineup,
      players: Array.from({ length: 10 }, (_, i) => ({ id: kind === 'starter' ? i + 2 : i + 1 })),
    });
    await expect(lineupCommandService.updateLineup('actor', lineup)).rejects.toMatchObject({
      code: 'LINEUP_ROSTER_CHANGED',
      status: 409,
    });
    expect(command).not.toHaveBeenCalled();
  });
  it('detects external edits and never overwrites automatically', async () => {
    await expect(
      lineupCommandService.updateLineup('actor', lineup, 'older-version')
    ).rejects.toMatchObject({ code: 'LINEUP_CHANGED_ELSEWHERE' });
    expect(command).not.toHaveBeenCalled();
  });
  it.each([
    {},
    { lineup, players: null },
    { lineup, players: [{ id: 'invalid' }] },
    { lineup, players: [{ id: 1 }, { id: 1 }] },
  ])('fails closed on incomplete ownership', async (payload) => {
    query.mockResolvedValue(payload);
    await expect(lineupCommandService.updateLineup('actor', lineup)).rejects.toMatchObject({
      code: 'LINEUP_OWNERSHIP_UNAVAILABLE',
    });
    expect(command).not.toHaveBeenCalled();
  });
  it.each([
    { ...lineup, playersID: [1, 1, 3, null, 5] },
    { ...lineup, type: '4-1-0' },
    { ...lineup, captain: 11 },
    { ...lineup, playersID: [5, 2, 3, null, 1] },
    { ...lineup, playersID: [null, null, null, null, null], captain: null },
  ])('rejects invalid selection without submitting', async (input) => {
    await expect(lineupCommandService.updateLineup('actor', input)).rejects.toMatchObject({
      status: 422,
    });
    expect(command).not.toHaveBeenCalled();
  });
  it('rejects invalid structure before opening credentials', async () => {
    await expect(lineupCommandService.updateLineup('actor', { playersID: [] })).rejects.toThrow();
    expect(executeUserProviderCommand).not.toHaveBeenCalled();
  });
  it('marks network failures after submission as unconfirmed and never retries', async () => {
    command.mockRejectedValue(new BiwengerNetworkError('synthetic network failure'));
    await expect(lineupCommandService.updateLineup('actor', lineup)).rejects.toMatchObject({
      code: 'LINEUP_SAVE_UNCONFIRMED',
    });
    expect(command).toHaveBeenCalledTimes(1);
  });
});

it('does not claim success for a malformed successful HTTP response', async () => {
  command.mockResolvedValue({
    status: 'completed',
    httpStatus: 200,
    raw: { raw: '<html>upstream</html>' },
  });
  await expect(lineupCommandService.updateLineup('actor', lineup)).rejects.toMatchObject({
    code: 'LINEUP_SAVE_UNCONFIRMED',
  });
  expect(command).toHaveBeenCalledTimes(1);
});

it('does not save when starter details cannot be verified', async () => {
  vi.mocked(readWorkspacePlayers).mockResolvedValue([]);
  await expect(lineupCommandService.updateLineup('actor', lineup)).rejects.toMatchObject({
    code: 'LINEUP_PLAYER_DETAILS_MISSING',
  });
  expect(command).not.toHaveBeenCalled();
});

it.each([{ status: 'error' }, null, [], 'invalid'])(
  'requires a verifiable provider confirmation',
  async (raw) => {
    command.mockResolvedValue({ status: 'completed', httpStatus: 200, raw });
    await expect(lineupCommandService.updateLineup('actor', lineup)).rejects.toMatchObject({
      code: 'LINEUP_SAVE_UNCONFIRMED',
    });
    expect(command).toHaveBeenCalledTimes(1);
  }
);
it.each([{ status: 200 }, { success: true, status: 204 }])(
  'accepts explicit provider confirmation',
  async (raw) => {
    command.mockResolvedValue({ status: 'completed', httpStatus: 200, raw });
    await expect(lineupCommandService.updateLineup('actor', lineup)).resolves.toMatchObject({
      status: 'completed',
    });
  }
);

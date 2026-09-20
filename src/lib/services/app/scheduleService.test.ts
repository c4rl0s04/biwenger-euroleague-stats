import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const read = vi.hoisted(() => vi.fn());
vi.mock('@/features/schedule/server', () => ({ getUserSchedule: read }));
import { getUserScheduleService } from './scheduleService';

it('retains Assistant argument defaults and the legacy Date projection without presentation-only fields', async () => {
  read.mockResolvedValue({
    found: true,
    round: { round_id: 7, round_name: 'Jornada 7' },
    matches: [
      { match_id: 1, date: '2025-10-01T18:00:00.000Z', user_players: [], listItem: { id: 1 } },
    ],
  });
  const result = await getUserScheduleService('0012');
  expect(read).toHaveBeenCalledWith('0012', null);
  expect(result.matches?.[0]).toEqual({
    match_id: 1,
    date: new Date('2025-10-01T18:00:00Z'),
    user_players: [],
  });
  await getUserScheduleService(12, '0');
  expect(read).toHaveBeenLastCalledWith(12, '0');
});

it('passes not-found and empty-squad results through without manufacturing fields', async () => {
  read.mockResolvedValue({ found: false, message: 'No upcoming rounds found.' });
  expect(await getUserScheduleService('12')).toEqual({
    found: false,
    message: 'No upcoming rounds found.',
  });
  read.mockResolvedValue({
    found: true,
    round: { round_id: 7, round_name: 'Jornada 7' },
    matches: [],
    message: 'User has no players.',
  });
  expect(await getUserScheduleService('12')).toEqual({
    found: true,
    round: { round_id: 7, round_name: 'Jornada 7' },
    matches: [],
    message: 'User has no players.',
  });
});

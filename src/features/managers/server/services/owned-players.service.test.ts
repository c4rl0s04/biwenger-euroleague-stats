import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../queries/owned-players.query', () => ({ fetchUserPlayers: vi.fn() }));
import { createOwnedPlayersService } from './owned-players.service';

it('returns only typed owned-player facts, preserving nulls and input order', async () => {
  const read = vi.fn(async () => [
    {
      id: 1,
      name: null,
      team_id: null,
      team_name: null,
      team_code: 'MAD',
      position: null,
      price: null,
      img: 'fixture.png',
      puntos: null,
      ignored: 'not public',
    },
  ]);
  const service = createOwnedPlayersService(read);
  expect(await service(12)).toEqual([
    {
      id: 1,
      name: null,
      teamId: null,
      teamName: null,
      teamCode: 'MAD',
      position: null,
      price: null,
      imageUrl: 'fixture.png',
      points: null,
    },
  ]);
  await service(13);
  expect(read).toHaveBeenCalledTimes(2);
  expect(read).toHaveBeenNthCalledWith(1, 12);
  expect(read).toHaveBeenNthCalledWith(2, 13);
});

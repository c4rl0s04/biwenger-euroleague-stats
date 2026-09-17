import { expect, it, vi } from 'vitest';
const read = vi.hoisted(() => vi.fn());
vi.mock('server-only', () => ({}));
vi.mock('../queries/team-names.query', () => ({ readTeamNames: read }));
import { getTeamNames } from './team-names.service';
it('keeps catalogue order and nullable labels while excluding database fields', async () => {
  read.mockResolvedValue([
    { id: 8, name: null, img: 'unused' },
    { id: 2, name: 'Fixture' },
  ]);
  expect(await getTeamNames()).toEqual([
    { id: 8, name: null },
    { id: 2, name: 'Fixture' },
  ]);
  await getTeamNames();
  expect(read).toHaveBeenCalledTimes(2);
});

import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createManagerComparisonService } from './comparison.service';
import { mapComparisonManager, mapComparisonSquadMember } from '../mappers/comparison.mapper';

it('allowlists manager fields without coercing IDs or nullable identity', () => {
  const row = {
    id: 7,
    name: null,
    icon: null,
    color_index: null,
    password: 'fixture-not-a-secret',
  };
  expect(mapComparisonManager(row)).toEqual({ id: 7, name: null, icon: null, color_index: null });
  expect(mapComparisonManager({ ...row, id: '07' }).id).toBe('07');
});
it('preserves old squad numeric conversions and rejects extra selected fields', () => {
  const row = {
    id: 1,
    name: null,
    position: null,
    team: null,
    status: null,
    average: '3.25',
    price: '12.9',
    points: '-2',
    extra: 'omit',
  };
  expect(mapComparisonSquadMember(row)).toEqual({
    id: 1,
    name: null,
    position: null,
    team: null,
    status: null,
    average: 3.25,
    price: 12,
    points: -2,
  });
  expect(
    mapComparisonSquadMember({ ...row, average: null, price: null, points: 'bad' })
  ).toMatchObject({ average: 0, price: 0, points: 0 });
});
it('rereads and preserves row order and input identity', async () => {
  const deps = {
    managers: vi.fn(async () => [
      { id: '2', name: null, icon: null, color_index: null },
      { id: '1', name: null, icon: null, color_index: null },
    ]),
    squad: vi.fn(async (_id: string | number) => []),
  };
  const service = createManagerComparisonService(deps);
  expect((await service.getComparisonManagers()).map((x) => x.id)).toEqual(['2', '1']);
  await service.getComparisonManagers();
  await service.getComparisonSquad('07');
  expect(deps.managers).toHaveBeenCalledTimes(2);
  expect(deps.squad).toHaveBeenCalledWith('07');
});

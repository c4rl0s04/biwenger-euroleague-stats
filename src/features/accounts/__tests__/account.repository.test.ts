import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {}, pgClient: { query: mocks.query } }));
vi.mock('@/lib/credentials/server', () => ({ biwengerCredentials: {} }));
import { AccountRepository } from '../server/repositories/account.repository';
const repository = new AccountRepository();
beforeEach(() => vi.resetAllMocks());
it('returns null for a missing account and preserves nullable passwords', async () => {
  mocks.query
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [{ id: '007', password: null }] });
  expect(await repository.getUserWithPassword('missing')).toBeNull();
  expect(await repository.getUserWithPassword('007')).toEqual({ id: '007', password: null });
  expect(mocks.query).toHaveBeenLastCalledWith('SELECT id, password FROM users WHERE id = $1', [
    '007',
  ]);
});
it('updates only the password using the existing parameter order', async () => {
  mocks.query.mockResolvedValue({ rows: [] });
  await repository.updateUserPassword('007', 'fixture-hash');
  expect(mocks.query).toHaveBeenCalledExactlyOnceWith(
    'UPDATE users SET password = $1 WHERE id = $2',
    ['fixture-hash', '007']
  );
});
it('propagates persistence errors unchanged', async () => {
  const failure = new Error('fixture');
  mocks.query.mockRejectedValue(failure);
  await expect(repository.getUserWithPassword('007')).rejects.toBe(failure);
  await expect(repository.updateUserPassword('007', 'fixture-hash')).rejects.toBe(failure);
});

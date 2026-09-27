import { beforeEach, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { query: { users: { findFirst } } } }));
import { findLoginAccount, findSessionAccount } from './repository';
beforeEach(() => vi.clearAllMocks());
it('parameterizes login input and limits the login projection', async () => {
  findFirst.mockResolvedValue(undefined);
  const name = "name' OR 1=1 --";
  expect(await findLoginAccount(name)).toBeUndefined();
  const query = findFirst.mock.calls[0][0];
  const sql = new PgDialect().sqlToQuery(query.where);
  expect(sql.params).toEqual([name]);
  expect(sql.sql).not.toContain(name);
  expect(query.columns).toEqual({ id: true, name: true, email: true, password: true });
});
it('refreshes only email by stable identity without caching', async () => {
  findFirst.mockResolvedValue({ email: null });
  expect(await findSessionAccount('1')).toEqual({ email: null });
  await findSessionAccount('1');
  expect(findFirst).toHaveBeenCalledTimes(2);
  expect(findFirst.mock.calls[0][0].columns).toEqual({ email: true });
  expect(new PgDialect().sqlToQuery(findFirst.mock.calls[0][0].where).params).toEqual(['1']);
  findFirst.mockRejectedValue(new Error('unavailable'));
  await expect(findSessionAccount('1')).rejects.toThrow('unavailable');
});

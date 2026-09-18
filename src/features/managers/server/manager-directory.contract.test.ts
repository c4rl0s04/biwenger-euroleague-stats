import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('./queries/manager-directory.query', () => ({ readManagerDirectoryRows: mocks.read }));
vi.mock('@/features/managers/server', async () => {
  const service = await import('./services/manager-directory.service');
  return { getManagerDirectory: service.getManagerDirectory };
});

import { GET, dynamic } from '@/app/api/users/route';
import {
  getManagerDirectory,
  MANAGER_DIRECTORY_POLICY,
} from './services/manager-directory.service';
import { mapManagerDirectoryRow } from './mappers/manager-directory.mapper';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.read.mockResolvedValue([]);
});

describe('Manager directory service and preserved HTTP contract', () => {
  it('allowlists public fields without coercing IDs or nullable fields', () => {
    const row = { id: '007', name: null, icon: null, color_index: 0, password: 'synthetic-canary' };
    const result = mapManagerDirectoryRow(row as any);
    expect(result).toEqual({ id: '007', name: null, icon: null, color_index: 0 });
    expect(result).not.toBe(row);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  it('preserves query order and does not add request or server memoization', async () => {
    const rows = [
      { id: '09', name: 'Z', icon: '', color_index: 2 },
      { id: '01', name: 'A', icon: null, color_index: 0 },
    ];
    mocks.read.mockResolvedValue(rows);
    expect(await getManagerDirectory()).toEqual(rows);
    rows[0].name = 'Changed';
    expect((await getManagerDirectory())[0].name).toBe('Changed');
    expect(mocks.read).toHaveBeenCalledTimes(2);
    expect(MANAGER_DIRECTORY_POLICY.serverCache).toContain('none');
  });

  it.each([{ rows: [] }, { rows: [{ id: '007', name: null, icon: null, color_index: 0 }] }])(
    'preserves public success envelope and exact cache directives: %j',
    async ({ rows }) => {
      mocks.read.mockResolvedValue(rows);
      const response = await GET();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, data: rows });
      expect(response.headers.get('Cache-Control')).toBe(MANAGER_DIRECTORY_POLICY.httpCache);
      expect(dynamic).toBe('force-dynamic');
    }
  );

  it('propagates service failures and retains the generic private HTTP error', async () => {
    const failure = new Error('synthetic-database-failure');
    mocks.read.mockRejectedValue(failure);
    await expect(getManagerDirectory()).rejects.toBe(failure);
    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, error: 'Internal Server Error' });
    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-store, max-age=0, must-revalidate'
    );
  });

  it('keeps identity-free directory reads separate from credential/session infrastructure', () => {
    const source = readFileSync(
      new URL('../../../app/api/users/route.ts', import.meta.url),
      'utf8'
    );
    expect(source).toContain('@/features/managers/server');
    expect(source).not.toMatch(/getRequestUserId|@\/auth|lib\/db|lib\/services/);
    const query = readFileSync(
      new URL('./queries/manager-directory.query.ts', import.meta.url),
      'utf8'
    );
    expect(query).toContain('@/lib/db/queries/core/manager-directory');
    expect(query).not.toMatch(/SELECT\s|features\/rounds/);
  });
});

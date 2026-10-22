import { beforeEach, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { getLineupWorkspace } from '../services/lineup-workspace.service';
import { GET } from '@/app/api/users/lineup/workspace/route';
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('../services/lineup-workspace.service', () => ({ getLineupWorkspace: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it('rejects anonymous callers without consulting the provider', async () => {
  vi.mocked(auth).mockResolvedValue(null as never);
  const response = await GET();
  expect(response.status).toBe(401);
  expect(getLineupWorkspace).not.toHaveBeenCalled();
  expect(response.headers.get('cache-control')).toContain('no-store');
});
it('uses only the session actor and serves a private workspace', async () => {
  vi.mocked(auth).mockResolvedValue({ user: { id: 'actor' } } as never);
  vi.mocked(getLineupWorkspace).mockResolvedValue({ players: [], baseline: 'snapshot' } as never);
  const response = await GET();
  expect(getLineupWorkspace).toHaveBeenCalledWith('actor');
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toContain('private');
  expect(await response.json()).toMatchObject({ success: true, data: { baseline: 'snapshot' } });
});

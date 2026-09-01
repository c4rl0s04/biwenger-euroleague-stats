import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';

vi.mock('@/lib/services', () => ({
  fetchAllUsers: vi.fn(),
}));

vi.mock('@/lib/services/lineupService', () => ({
  lineupService: {
    getLineup: vi.fn(),
    updateLineup: vi.fn(),
  },
}));

vi.mock('@/lib/db/queries/core/users', () => ({
  getUserWithPassword: vi.fn(),
}));

vi.mock('@/lib/db/mutations/users', () => ({
  prepareUserMutations: vi.fn(),
}));

vi.mock('@/lib/db', () => {
  const updateChain = {
    set: vi.fn(() => ({
      where: vi.fn(async () => undefined),
    })),
  };

  return {
    pgClient: {},
    db: {
      query: {
        users: {
          findFirst: vi.fn(),
        },
      },
      update: vi.fn(() => updateChain),
    },
  };
});

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

import * as services from '@/lib/services';
import { lineupService } from '@/lib/services/lineupService';
import { getUserWithPassword } from '@/lib/db/queries/core/users';
import { prepareUserMutations } from '@/lib/db/mutations/users';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

function makeRequest(path: string, params: Record<string, string> = {}): NextRequest {
  const url = new URL(path);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return new NextRequest(url.toString());
}

function jsonRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('user and lineup route contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('covers GET /api/users success and error envelopes', async () => {
    vi.mocked(services.fetchAllUsers).mockResolvedValue([{ id: '1', name: 'User' }] as any);

    const { GET } = await import('@/app/api/users/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true, data: [{ id: '1', name: 'User' }] });

    vi.mocked(services.fetchAllUsers).mockRejectedValue(new Error('fail'));
    const errorResponse = await GET();
    expect(errorResponse.status).toBe(500);
    expect((await errorResponse.json()).success).toBe(false);
  });

  it('covers GET and POST /api/users/lineup contracts', async () => {
    vi.mocked(lineupService.getLineup).mockResolvedValue({ playersID: [1] } as any);
    vi.mocked(lineupService.updateLineup).mockResolvedValue({
      status: 200,
      token: 'lineup-provider-canary-token',
      privateProviderPayload: { authorization: 'Bearer lineup-provider-canary-token' },
    } as any);

    const { GET, POST } = await import('@/app/api/users/lineup/route');
    const getResponse = await GET(makeRequest('http://localhost/api/users/lineup'));
    expect(getResponse.status).toBe(200);
    expect((await getResponse.json()).success).toBe(true);
    expect(lineupService.getLineup).toHaveBeenCalledWith('42');

    const postResponse = await POST(
      jsonRequest('http://localhost/api/users/lineup', {
        userId: 'not-the-session-user',
        lineup: { type: '1-2-2', playersID: [1], reservesID: [], captain: 1 },
      })
    );
    const postJson = await postResponse.json();
    expect(postResponse.status).toBe(200);
    expect(postJson.success).toBe(true);
    expect(postJson.data.message).toBe('Alineación actualizada en Biwenger');
    expect(JSON.stringify(postJson)).not.toContain('lineup-provider-canary-token');
    expect(JSON.stringify(postJson)).not.toContain('privateProviderPayload');
    expect(postResponse.headers.get('cache-control')).toContain('private');
    expect(postResponse.headers.get('cache-control')).toContain('no-store');
    expect(lineupService.updateLineup).toHaveBeenCalledWith({
      lineup: { type: '1-2-2', playersID: [1], reservesID: [], captain: 1 },
      userId: '42',
    });

    const missingPost = await POST(jsonRequest('http://localhost/api/users/lineup', {}));
    expect(missingPost.status).toBe(400);
    expect(missingPost.headers.get('cache-control')).toContain('no-store');
  });

  it('rejects unauthenticated lineup reads and writes', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const { GET, POST } = await import('@/app/api/users/lineup/route');
    const getResponse = await GET(makeRequest('http://localhost/api/users/lineup'));
    const postResponse = await POST(
      jsonRequest('http://localhost/api/users/lineup', {
        lineup: { type: '1-2-2', playersID: [1], reservesID: [], captain: 1 },
      })
    );

    expect(getResponse.status).toBe(401);
    expect(postResponse.status).toBe(401);
    expect(lineupService.getLineup).not.toHaveBeenCalled();
    expect(lineupService.updateLineup).not.toHaveBeenCalled();
  });

  it('covers /api/user/change-password auth and success contracts', async () => {
    vi.mocked(getUserWithPassword).mockResolvedValue({ id: '42', password: 'old-hash' } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);
    const updateUserPassword = vi.fn(async () => undefined);
    vi.mocked(prepareUserMutations).mockReturnValue({ updateUserPassword } as any);

    const { POST } = await import('@/app/api/user/change-password/route');
    const response = await POST(
      jsonRequest('http://localhost/api/user/change-password', {
        currentPassword: 'old',
        newPassword: 'new',
      }) as any
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'Contraseña actualizada correctamente' });
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(updateUserPassword).toHaveBeenCalledWith('new-hash', '42');

    vi.mocked(auth).mockResolvedValue(null as any);
    const unauthorized = await POST(
      jsonRequest('http://localhost/api/user/change-password', {
        currentPassword: 'old',
        newPassword: 'new',
      }) as any
    );
    expect(unauthorized.status).toBe(401);
  });

  it('covers /api/user/link-biwenger validation and success contracts', async () => {
    const canaryToken = 'link-biwenger-canary-token';
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: '42',
      email: 'u@example.com',
    } as any);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          token: canaryToken,
          privateProviderPayload: { authorization: `Bearer ${canaryToken}` },
        }),
      }))
    );

    const { POST } = await import('@/app/api/user/link-biwenger/route');
    const response = await POST(
      jsonRequest('http://localhost/api/user/link-biwenger', { password: 'secret' }) as any
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe('linked');
    expect(json.biwengerLinked).toBe(true);
    expect(JSON.stringify(json)).not.toContain(canaryToken);
    expect(JSON.stringify(json)).not.toContain('token');
    expect(JSON.stringify(json)).not.toContain('privateProviderPayload');
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');

    const missingPassword = await POST(
      jsonRequest('http://localhost/api/user/link-biwenger', {}) as any
    );
    expect(missingPassword.status).toBe(400);
    expect(missingPassword.headers.get('cache-control')).toContain('no-store');
  }, 10000);

  it('does not forward or log an unsafe Biwenger authentication response', async () => {
    const canaryToken = 'provider-error-canary-token';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: '42',
      email: 'u@example.com',
    } as any);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({
          token: canaryToken,
          message: `Authorization Bearer ${canaryToken}`,
        }),
      }))
    );

    const { POST } = await import('@/app/api/user/link-biwenger/route');
    const response = await POST(
      jsonRequest('http://localhost/api/user/link-biwenger', {
        password: 'synthetic-secret',
      }) as any
    );
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(JSON.stringify(json)).not.toContain(canaryToken);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(canaryToken);
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
});

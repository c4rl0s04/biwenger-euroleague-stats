import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    vi.mocked(lineupService.updateLineup).mockResolvedValue({ ok: true } as any);

    const { GET, POST } = await import('@/app/api/users/lineup/route');
    const getResponse = await GET(
      makeRequest('http://localhost/api/users/lineup', { userId: '42' })
    );
    expect(getResponse.status).toBe(200);
    expect((await getResponse.json()).success).toBe(true);

    const missingGet = await GET(makeRequest('http://localhost/api/users/lineup'));
    expect(missingGet.status).toBe(400);

    const postResponse = await POST(
      jsonRequest('http://localhost/api/users/lineup', {
        userId: '42',
        lineup: { type: '1-2-2', playersID: [1], reservesID: [], captain: 1 },
      })
    );
    const postJson = await postResponse.json();
    expect(postResponse.status).toBe(200);
    expect(postJson.success).toBe(true);
    expect(postJson.data.message).toBe('Alineación actualizada en Biwenger');

    const missingPost = await POST(
      jsonRequest('http://localhost/api/users/lineup', { userId: '42' })
    );
    expect(missingPost.status).toBe(400);
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
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: '42',
      email: 'u@example.com',
    } as any);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ token: 'token-123' }),
      }))
    );

    const { POST } = await import('@/app/api/user/link-biwenger/route');
    const response = await POST(
      jsonRequest('http://localhost/api/user/link-biwenger', { password: 'secret' }) as any
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe('linked');
    expect(json.token).toBe('token-123');

    const missingPassword = await POST(
      jsonRequest('http://localhost/api/user/link-biwenger', {}) as any
    );
    expect(missingPassword.status).toBe(400);
  }, 10000);
});

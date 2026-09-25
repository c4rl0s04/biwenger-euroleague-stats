import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from './route';
import * as healthService from '@/lib/db/health';

vi.mock('@/lib/db/health', () => ({
  checkDatabaseHealth: vi.fn(),
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns HTTP 200 with healthy payload and no-cache headers when database is ok', async () => {
    vi.mocked(healthService.checkDatabaseHealth).mockResolvedValueOnce({
      ok: true,
      latencyMs: 12,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    expect(data.status).toBe('healthy');
    expect(data.database).toEqual({ status: 'connected', latencyMs: 12 });
    expect(typeof data.timestamp).toBe('string');
    expect(typeof data.uptime).toBe('number');
  });

  it('returns HTTP 503 with unhealthy payload when database check fails', async () => {
    vi.mocked(healthService.checkDatabaseHealth).mockResolvedValueOnce({
      ok: false,
      latencyMs: 45,
      error: 'Connection timeout',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    expect(data.status).toBe('unhealthy');
    expect(data.database).toEqual({
      status: 'disconnected',
      latencyMs: 45,
      error: 'Connection timeout',
    });
  });
});

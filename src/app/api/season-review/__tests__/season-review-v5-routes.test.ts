import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';

const { repository } = vi.hoisted(() => ({
  repository: {
    getCatalog: vi.fn(),
    getReport: vi.fn(),
    listRuns: vi.fn(),
    getRun: vi.fn(),
  },
}));

vi.mock('@/lib/season-review/emergent-artifact-service', () => ({
  getEmergentArtifactRepository: () => repository,
}));

const config = {
  configId: 's15-m20-inverse-10000',
  rosterCap: 15,
  marketSlots: 20,
  payoutDirection: 'inverse',
  eurosPerPoint: 10_000,
};

describe('season review V5 route contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: 'manager-1' } } as never);
    repository.getCatalog.mockResolvedValue({
      version: 5,
      modelVersion: 'agent-season-v5',
      generationId: 'generation-1',
      generatedAt: '2026-08-21T12:00:00.000Z',
      dataset: { seasonId: '2025-26' },
      baseRuns: 2_048,
      finalistRuns: 8_192,
      configurations: [{ config, sampleSize: 2_048, reportKey: 'report', runIndexKey: 'index' }],
      ranking: [],
      cap15Analysis: [],
    });
    repository.getReport.mockResolvedValue({ config, sampleSize: 2_048 });
    repository.listRuns.mockResolvedValue({
      data: [{ runId: 'run-1', seed: 1 }],
      nextCursor: null,
      total: 1,
    });
    repository.getRun.mockResolvedValue({ runId: 'run-1', seed: 1, config });
  });

  it('authenticates and validates the configuration catalog', async () => {
    const { GET } = await import('@/app/api/season-review/configurations/route');
    const response = await GET(
      new NextRequest(
        'http://localhost/api/season-review/configurations?rosterCap=15&eurosPerPoint=10000'
      )
    );
    expect(response.status).toBe(200);
    expect((await response.json()).data[0].config.configId).toBe(config.configId);

    const invalid = await GET(
      new NextRequest('http://localhost/api/season-review/configurations?rosterCap=9')
    );
    expect(invalid.status).toBe(422);

    vi.mocked(auth).mockResolvedValue(null as never);
    const unauthorized = await GET(
      new NextRequest('http://localhost/api/season-review/configurations')
    );
    expect(unauthorized.status).toBe(401);
  });

  it('returns aggregate reports and paginated run summaries', async () => {
    const reportRoute = await import('@/app/api/season-review/configurations/[configId]/route');
    const report = await reportRoute.GET(new NextRequest('http://localhost'), {
      params: Promise.resolve({ configId: config.configId }),
    });
    expect(report.status).toBe(200);
    expect((await report.json()).data.sampleSize).toBe(2_048);

    const runsRoute = await import('@/app/api/season-review/configurations/[configId]/runs/route');
    const runs = await runsRoute.GET(new NextRequest('http://localhost?limit=25'), {
      params: Promise.resolve({ configId: config.configId }),
    });
    expect(runs.status).toBe(200);
    expect((await runs.json()).pagination.total).toBe(1);
    expect(repository.listRuns).toHaveBeenCalledWith(config.configId, {
      cursor: null,
      limit: 25,
    });
  });

  it('returns one complete run and a consistent 404', async () => {
    const route =
      await import('@/app/api/season-review/configurations/[configId]/runs/[runId]/route');
    const response = await route.GET(new NextRequest('http://localhost'), {
      params: Promise.resolve({ configId: config.configId, runId: 'run-1' }),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).data.seed).toBe(1);

    repository.getRun.mockResolvedValue(null);
    const missing = await route.GET(new NextRequest('http://localhost'), {
      params: Promise.resolve({ configId: config.configId, runId: 'run-999' }),
    });
    expect(missing.status).toBe(404);
  });
});

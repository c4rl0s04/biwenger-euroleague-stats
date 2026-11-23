import { beforeEach, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { PredictionError, saveSeasonPredictions } from '@/features/season-predictions/server';
import { PUT } from './route';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/features/season-predictions/server', async () => {
  const { PredictionError } = await import('@/features/season-predictions/models/submission');
  return { PredictionError, saveSeasonPredictions: vi.fn() };
});

const request = (extra: Record<string, unknown> = {}) =>
  new Request('http://localhost/api/season-predictions/submission', {
    method: 'PUT',
    body: JSON.stringify({ seasonId: '2026-27', revision: 0, answers: {}, ...extra }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never);
});

it('rejects unauthenticated writes with private no-store headers', async () => {
  vi.mocked(auth).mockResolvedValue(null as never);
  const response = await PUT(request());
  expect(response.status).toBe(401);
  expect(response.headers.get('Cache-Control')).toContain('no-store');
  expect(saveSeasonPredictions).not.toHaveBeenCalled();
});

it('passes only the authenticated identity to the service', async () => {
  vi.mocked(saveSeasonPredictions).mockResolvedValue({
    answers: {},
    revision: 1,
    updatedAt: '2026-10-02T00:00:00Z',
  });
  const response = await PUT(request());
  expect(response.status).toBe(200);
  expect(saveSeasonPredictions).toHaveBeenCalledWith({
    seasonId: '2026-27',
    userId: 'u1',
    revision: 0,
    answers: {},
    phase: 'preseason',
  });
  expect(response.headers.get('Cache-Control')).toContain('no-store');
});

it('forwards the playoffs phase and rejects unknown phases', async () => {
  vi.mocked(saveSeasonPredictions).mockResolvedValue({
    answers: { 'PI-1': { winner: '7' } },
    revision: 1,
    updatedAt: '2027-04-10T00:00:00Z',
  });
  const answers = { 'PI-1': { winner: '7' } };
  expect((await PUT(request({ phase: 'playoffs', answers }))).status).toBe(200);
  expect(saveSeasonPredictions).toHaveBeenCalledWith({
    seasonId: '2026-27',
    userId: 'u1',
    revision: 0,
    answers,
    phase: 'playoffs',
  });
  for (const phase of ['regular', '', null, 1, ['playoffs']]) {
    const response = await PUT(request({ phase }));
    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  }
  expect(saveSeasonPredictions).toHaveBeenCalledTimes(1);
});

it('maps a playoffs save after the first tip-off to 423', async () => {
  vi.mocked(saveSeasonPredictions).mockRejectedValueOnce(
    new PredictionError('locked', 'El plazo de predicciones ha terminado.')
  );
  expect((await PUT(request({ phase: 'playoffs' }))).status).toBe(423);
});

it('returns forbidden for a non-member and conflict for a stale revision', async () => {
  vi.mocked(saveSeasonPredictions).mockRejectedValueOnce(
    new PredictionError('not-member', 'No perteneces a esta temporada.')
  );
  expect((await PUT(request())).status).toBe(403);
  vi.mocked(saveSeasonPredictions).mockRejectedValueOnce(
    new PredictionError('conflict', 'Revisión antigua.')
  );
  expect((await PUT(request())).status).toBe(409);
});

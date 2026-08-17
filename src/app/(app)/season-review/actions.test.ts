import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { simulateSeasonReview } from '@/lib/services';
import { DEFAULT_SCENARIO } from '@/lib/season-review/engine';
import { runSeasonReviewScenario } from './actions';

vi.mock('@/lib/services', () => ({
  simulateSeasonReview: vi.fn(),
}));

describe('season review server action', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects unauthenticated simulations', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    await expect(runSeasonReviewScenario(DEFAULT_SCENARIO)).resolves.toEqual({
      success: false,
      error: 'No autorizado',
    });
    expect(simulateSeasonReview).not.toHaveBeenCalled();
  });

  it('returns a simulated scenario for an authenticated user', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'manager-1' } } as never);
    vi.mocked(simulateSeasonReview).mockResolvedValue({ totalPayout: 42 } as never);
    await expect(runSeasonReviewScenario(DEFAULT_SCENARIO)).resolves.toEqual({
      success: true,
      data: { totalPayout: 42 },
    });
  });

  it('does not leak validation or database errors', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'manager-1' } } as never);
    vi.mocked(simulateSeasonReview).mockRejectedValue(new Error('sensitive details'));
    await expect(runSeasonReviewScenario({})).resolves.toEqual({
      success: false,
      error: 'No se pudo calcular el escenario',
    });
  });
});

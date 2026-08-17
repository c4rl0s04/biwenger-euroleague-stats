import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { simulateSeasonResilience } from '@/lib/services';
import { runSeasonReviewScenario } from './actions';

vi.mock('@/lib/services', () => ({
  simulateSeasonResilience: vi.fn(),
}));

const request = {
  config: {
    rosterCap: 15,
    payoutDirection: 'inverse',
    eurosPerPoint: 10_000,
    marketSlots: 20,
  },
  shock: { kind: 'bad-transfer', severity: 'medium', appliedRound: 5 },
};

describe('season review server action', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects unauthenticated simulations', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    await expect(runSeasonReviewScenario(request)).resolves.toEqual({
      success: false,
      error: 'No autorizado',
    });
    expect(simulateSeasonResilience).not.toHaveBeenCalled();
  });

  it('returns a simulated scenario for an authenticated user', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'manager-1' } } as never);
    vi.mocked(simulateSeasonResilience).mockResolvedValue({
      deltaRecoveryProbability: 0.2,
    } as never);
    await expect(runSeasonReviewScenario(request)).resolves.toEqual({
      success: true,
      data: { deltaRecoveryProbability: 0.2 },
    });
  });

  it('does not leak validation or database errors', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'manager-1' } } as never);
    vi.mocked(simulateSeasonResilience).mockRejectedValue(new Error('sensitive details'));
    await expect(runSeasonReviewScenario({})).resolves.toEqual({
      success: false,
      error: 'No se pudo calcular el escenario',
    });
  });
});

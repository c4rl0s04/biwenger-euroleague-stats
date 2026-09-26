import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';

vi.setConfig({ testTimeout: 15000 });

const { hoopgridReadServiceMock, hoopgridCommandServiceMock } = vi.hoisted(() => {
  return {
    hoopgridReadServiceMock: {
      listChallenges: vi.fn(),
      getTodayChallenge: vi.fn(),
    },
    hoopgridCommandServiceMock: {
      submitGuess: vi.fn(),
      submitBatchGuesses: vi.fn(),
    },
  };
});

vi.mock('@/features/hoopgrid/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/hoopgrid/server')>();
  return {
    ...actual,
    hoopgridReadService: hoopgridReadServiceMock,
    hoopgridCommandService: hoopgridCommandServiceMock,
  };
});

function request(path: string): NextRequest {
  return new NextRequest(path);
}

function jsonRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('hoopgrid route contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as any);

    hoopgridReadServiceMock.listChallenges.mockResolvedValue({
      challenges: [
        {
          id: 'challenge-1',
          gameDate: '2026-05-18',
          number: 1,
          possibleCounts: '[1]',
          complexity: 42,
        },
      ],
    });

    hoopgridReadServiceMock.getTodayChallenge.mockResolvedValue({
      challenge: {
        id: 'challenge-1',
        gameDate: '2026-05-18',
        number: 1,
        rows: [],
        cols: [],
        possibleCounts: [1],
        complexity: 42,
        isActive: true,
      },
      userGuesses: [
        {
          cellIndex: 0,
          playerId: 1,
          isCorrect: true,
          playerName: 'Player',
          playerImg: null,
          rarity: 7,
        },
      ],
    });
  });

  it('covers GET /api/hoopgrid/list contract', async () => {
    const { GET } = await import('@/app/api/hoopgrid/list/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.challenges).toEqual([
      {
        id: 'challenge-1',
        gameDate: '2026-05-18',
        number: 1,
        possibleCounts: '[1]',
        complexity: 42,
      },
    ]);
  });

  it('covers GET /api/hoopgrid/today existing challenge contract', async () => {
    const { GET } = await import('@/app/api/hoopgrid/today/route');
    const response = await GET(request('http://localhost/api/hoopgrid/today?date=2026-05-18'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.challenge.id).toBe('challenge-1');
    expect(json.challenge.complexity).toBe(42);
    expect(json.userGuesses[0].rarity).toBe(7);
    expect(hoopgridReadServiceMock.getTodayChallenge).toHaveBeenCalledWith('2026-05-18', '42');
  });

  it('covers POST /api/hoopgrid/guess auth and success contracts', async () => {
    hoopgridCommandServiceMock.submitGuess.mockResolvedValue({
      isCorrect: true,
      rarity: 15,
      guess: { id: 'g1' },
    });

    const { POST } = await import('@/app/api/hoopgrid/guess/route');
    const response = await POST(
      jsonRequest('http://localhost/api/hoopgrid/guess', {
        challengeId: 'challenge-1',
        cellIndex: 0,
        playerId: 1,
        dryRun: false,
      })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      isCorrect: true,
      rarity: 15,
      guess: { id: 'g1' },
    });

    vi.mocked(auth).mockResolvedValue(null as any);
    const unauthorized = await POST(
      jsonRequest('http://localhost/api/hoopgrid/guess', {
        challengeId: 'challenge-1',
        cellIndex: 0,
        playerId: 1,
      })
    );
    expect(unauthorized.status).toBe(401);
  });

  it('covers POST /api/hoopgrid/guess batch contract', async () => {
    hoopgridCommandServiceMock.submitBatchGuesses.mockResolvedValue({
      success: true,
      results: [{ cellIndex: 0, isCorrect: true, rarity: 15 }],
    });

    const { POST } = await import('@/app/api/hoopgrid/guess/route');
    const response = await POST(
      jsonRequest('http://localhost/api/hoopgrid/guess', {
        action: 'submitBatch',
        challengeId: 'challenge-1',
        guesses: {
          0: { playerId: 1, isCorrect: true },
          1: { playerId: 2, isCorrect: false },
        },
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.results).toEqual([{ cellIndex: 0, isCorrect: true, rarity: 15 }]);
  });
});

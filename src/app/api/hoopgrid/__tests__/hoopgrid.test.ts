import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';

vi.setConfig({ testTimeout: 15000 });

const { dbMock, hoopgridServiceMock } = vi.hoisted(() => {
  const selectable = {
    orderBy: vi.fn(),
    leftJoin: vi.fn(() => ({
      where: vi.fn(),
    })),
  };

  return {
    dbMock: {
      query: {
        hoopgridChallenges: {
          findFirst: vi.fn(),
        },
      },
      select: vi.fn(() => ({
        from: vi.fn(() => selectable),
      })),
      selectable,
    },
    hoopgridServiceMock: {
      submitGuess: vi.fn(),
      generateDailyChallenge: vi.fn(),
    },
  };
});

vi.mock('@/lib/db', () => ({
  db: dbMock,
}));

vi.mock('@/lib/services/features/hoopgridService', () => ({
  hoopgridService: hoopgridServiceMock,
  HoopgridService: {
    calculateComplexity: vi.fn(() => 42),
    getRarity: vi.fn(async () => 7),
  },
}));

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
    dbMock.selectable.orderBy.mockResolvedValue([
      { id: 'challenge-1', gameDate: '2026-05-18', number: 1, possibleCounts: '[1]' },
    ]);
    dbMock.selectable.leftJoin.mockReturnValue({
      where: vi.fn(async () => [
        { cellIndex: 0, playerId: 1, isCorrect: true, playerName: 'Player', playerImg: null },
      ]),
    });
    dbMock.query.hoopgridChallenges.findFirst.mockResolvedValue({
      id: 'challenge-1',
      gameDate: '2026-05-18',
      rows: '[]',
      cols: '[]',
      possibleCounts: '[1]',
      isActive: true,
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
  }, 10000);

  it('covers GET /api/hoopgrid/today existing challenge contract', async () => {
    const { GET } = await import('@/app/api/hoopgrid/today/route');
    const response = await GET(request('http://localhost/api/hoopgrid/today?date=2026-05-18'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.challenge.id).toBe('challenge-1');
    expect(json.challenge.complexity).toBe(42);
    expect(json.userGuesses[0].rarity).toBe(7);
  });

  it('covers POST /api/hoopgrid/guess auth and success contracts', async () => {
    hoopgridServiceMock.submitGuess.mockResolvedValue({ success: true, isCorrect: true });

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
    expect(await response.json()).toEqual({ success: true, isCorrect: true });

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
    hoopgridServiceMock.submitGuess.mockResolvedValue({ success: true });

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
    expect(json.results).toEqual([{ cellIndex: 0, success: true }]);
  });
});

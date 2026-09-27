import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HoopgridCommandService } from '../server/services/hoopgrid-command.service';
import { HoopgridRepository } from '../server/repositories/hoopgrid.repository';
import { HoopgridValidationError } from '../validation/hoopgrid.schema';

vi.mock('@/lib/db/season-context', () => ({
  resolveReadSeasonId: vi.fn(async () => '2025-2026'),
}));

describe('HoopgridCommandService', () => {
  let repositoryMock: Partial<Record<keyof HoopgridRepository, any>>;
  let service: HoopgridCommandService;

  beforeEach(() => {
    repositoryMock = {
      findChallengeByDate: vi.fn(),
      findChallengeById: vi.fn(),
      listChallenges: vi.fn(),
      insertChallengeSafely: vi.fn(),
      getNextChallengeNumber: vi.fn(),
      getUserGuesses: vi.fn(),
      getRarity: vi.fn(async () => 25),
      upsertGuess: vi.fn(async (data) => ({ id: 'g-1', ...data })),
      getPlayerValidationContext: vi.fn(),
      getSeasonFullData: vi.fn(),
    };

    service = new HoopgridCommandService(repositoryMock as unknown as HoopgridRepository);
  });

  describe('calculateComplexity', () => {
    it('returns 0 for null, empty or invalid possibleCounts', () => {
      expect(service.calculateComplexity(null)).toBe(0);
      expect(service.calculateComplexity([])).toBe(0);
      expect(service.calculateComplexity('')).toBe(0);
      expect(service.calculateComplexity('[]')).toBe(0);
    });

    it('returns 100 for cells with 1 or 0 options', () => {
      expect(service.calculateComplexity([1, 1, 1, 1, 1, 1, 1, 1, 1])).toBe(100);
      expect(service.calculateComplexity('[1, 0, 1, 1, 1, 1, 1, 1, 1]')).toBe(100);
    });

    it('calculates lower complexity for cells with many options', () => {
      const counts = [10, 20, 30, 40, 50, 60, 70, 80, 90];
      const complexity = service.calculateComplexity(counts);
      expect(complexity).toBeLessThan(50);
      expect(complexity).toBeGreaterThan(0);
    });
  });

  describe('hasValidMatching', () => {
    it('returns true when a distinct matching of 9 players exists', () => {
      const cells = [
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 8],
        [8, 9],
        [9, 10],
      ];
      expect(service.hasValidMatching(cells)).toBe(true);
    });

    it('returns false when no distinct matching exists (e.g. pigeonhole conflict)', () => {
      // 9 cells, but only 8 unique players across all of them
      const cells = [
        [1],
        [1], // Two cells only have player 1 -> impossible to match distinctly
        [3],
        [4],
        [5],
        [6],
        [7],
        [8],
        [9],
      ];
      expect(service.hasValidMatching(cells)).toBe(false);
    });
  });

  describe('validateCriteriaSync', () => {
    const basePlayer = {
      id: 10,
      name: 'Test Player',
      teamId: 'RMB',
      position: 'Base',
      country: 'Spain',
      price: 10000000,
      height: 195,
      birthDate: '1995-05-10',
      ownerId: 'u-1',
    };

    it('validates team, pos, and country criteria', () => {
      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'team', value: 'RMB', label: 'RMB' },
          [],
          []
        )
      ).toBe(true);
      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'team', value: 'BAR', label: 'BAR' },
          [],
          []
        )
      ).toBe(false);

      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'pos', value: 'Base', label: 'Base' },
          [],
          []
        )
      ).toBe(true);
      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'pos', value: 'Pivot', label: 'Pivot' },
          [],
          []
        )
      ).toBe(false);

      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'country', value: 'Spain', label: 'Spain' },
          [],
          []
        )
      ).toBe(true);
      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'country', value: 'France', label: 'France' },
          [],
          []
        )
      ).toBe(false);
    });

    it('validates price, height, and age criteria', () => {
      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'price_min', value: 8000000, label: '8M+' },
          [],
          []
        )
      ).toBe(true);
      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'price_max', value: 5000000, label: '<5M' },
          [],
          []
        )
      ).toBe(false);

      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'height_min', value: 190, label: '190+' },
          [],
          []
        )
      ).toBe(true);
      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'height_max', value: 190, label: '<190' },
          [],
          []
        )
      ).toBe(false);

      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'age_min', value: 20, label: '20+' },
          [],
          []
        )
      ).toBe(true);
      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'age_max', value: 18, label: '<18' },
          [],
          []
        )
      ).toBe(false);
    });

    it('validates stat averages, single game, and totals', () => {
      const stats = [
        { points: 20, assists: 10, rebounds: 5 },
        { points: 10, assists: 6, rebounds: 7 },
      ];

      // Average points: (20 + 10) / 2 = 15
      expect(
        service.validateCriteriaSync(
          basePlayer,
          stats,
          { type: 'stat_avg', value: { field: 'points', threshold: 15 }, label: '15+ Pts avg' },
          [],
          []
        )
      ).toBe(true);

      // Single game points: max(20, 10) = 20
      expect(
        service.validateCriteriaSync(
          basePlayer,
          stats,
          { type: 'stat_single', value: { field: 'points', threshold: 25 }, label: '25+ Pts peak' },
          [],
          []
        )
      ).toBe(false);

      // Total points: 20 + 10 = 30
      expect(
        service.validateCriteriaSync(
          basePlayer,
          stats,
          { type: 'stat_total', value: { field: 'points', threshold: 30 }, label: '30+ Pts total' },
          [],
          []
        )
      ).toBe(true);
    });

    it('validates double_double and percentage', () => {
      const statsWithDoubleDouble = [
        { points: 12, rebounds: 10, assists: 4, steals: 1, blocks: 0 },
      ];
      expect(
        service.validateCriteriaSync(
          basePlayer,
          statsWithDoubleDouble,
          { type: 'double_double', value: {}, label: 'DD' },
          [],
          []
        )
      ).toBe(true);

      const statsWithPercentage = [{ threePointsMade: 4, threePointsAttempted: 8 }];
      expect(
        service.validateCriteriaSync(
          basePlayer,
          statsWithPercentage,
          {
            type: 'percentage',
            value: {
              madeField: 'threePointsMade',
              attField: 'threePointsAttempted',
              threshold: 0.5,
            },
            label: '50% 3P',
          },
          [],
          []
        )
      ).toBe(true);
    });

    it('validates ownership and user_ownership', () => {
      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          {
            type: 'user_ownership',
            value: { userId: 'u-1', mode: 'current' },
            label: 'u-1 current',
          },
          [],
          []
        )
      ).toBe(true);

      expect(
        service.validateCriteriaSync(
          { ...basePlayer, ownerId: 'u-2' },
          [],
          { type: 'user_ownership', value: { userId: 'u-1', mode: 'past' }, label: 'u-1 past' },
          [{ userId: 'u-1', playerId: 10 }],
          []
        )
      ).toBe(true);

      expect(
        service.validateCriteriaSync(
          basePlayer,
          [],
          { type: 'ownership', value: 'current', label: 'Current' },
          [],
          []
        )
      ).toBe(true);

      expect(
        service.validateCriteriaSync(
          { ...basePlayer, ownerId: null },
          [],
          { type: 'ownership', value: 'free', label: 'Free' },
          [],
          []
        )
      ).toBe(true);
    });
  });

  describe('submitGuess', () => {
    it('throws HoopgridValidationError if userId is missing', async () => {
      await expect(
        service.submitGuess({ challengeId: 'ch-1', cellIndex: 0, playerId: 1 }, '')
      ).rejects.toThrow(HoopgridValidationError);
    });

    it('evaluates and records a correct guess', async () => {
      repositoryMock.findChallengeById.mockResolvedValue({
        id: 'ch-1',
        rows: JSON.stringify([{ type: 'pos', value: 'Base', label: 'Base' }]),
        cols: JSON.stringify([{ type: 'country', value: 'Spain', label: 'Spain' }]),
      });

      repositoryMock.getPlayerValidationContext.mockResolvedValue({
        player: { id: 10, position: 'Base', country: 'Spain' },
        stats: [],
        initials: [],
        transfers: [],
        allUsers: [],
      });

      const result = await service.submitGuess(
        { challengeId: 'ch-1', cellIndex: 0, playerId: 10, dryRun: false },
        'user-42'
      );

      expect(result.isCorrect).toBe(true);
      expect(result.rarity).toBe(25);
      expect(repositoryMock.upsertGuess).toHaveBeenCalledWith({
        challengeId: 'ch-1',
        userId: 'user-42',
        cellIndex: 0,
        playerId: 10,
        isCorrect: true,
      });
    });

    it('does not persist to DB when dryRun is true', async () => {
      repositoryMock.findChallengeById.mockResolvedValue({
        id: 'ch-1',
        rows: JSON.stringify([{ type: 'pos', value: 'Base', label: 'Base' }]),
        cols: JSON.stringify([{ type: 'country', value: 'Spain', label: 'Spain' }]),
      });

      repositoryMock.getPlayerValidationContext.mockResolvedValue({
        player: { id: 10, position: 'Base', country: 'Spain' },
        stats: [],
        initials: [],
        transfers: [],
        allUsers: [],
      });

      const result = await service.submitGuess(
        { challengeId: 'ch-1', cellIndex: 0, playerId: 10, dryRun: true },
        'user-42'
      );

      expect(result.isCorrect).toBe(true);
      expect(result.guess?.id).toBe('draft');
      expect(repositoryMock.upsertGuess).not.toHaveBeenCalled();
    });
  });

  describe('submitBatchGuesses', () => {
    it('submits correct guesses from a batch', async () => {
      repositoryMock.findChallengeById.mockResolvedValue({
        id: 'ch-1',
        rows: JSON.stringify([
          { type: 'pos', value: 'Base', label: 'Base' },
          { type: 'pos', value: 'Alero', label: 'Alero' },
        ]),
        cols: JSON.stringify([
          { type: 'country', value: 'Spain', label: 'Spain' },
          { type: 'country', value: 'France', label: 'France' },
        ]),
      });

      repositoryMock.getPlayerValidationContext.mockResolvedValue({
        player: { id: 10, position: 'Base', country: 'Spain' },
        stats: [],
        initials: [],
        transfers: [],
        allUsers: [],
      });

      const result = await service.submitBatchGuesses(
        {
          challengeId: 'ch-1',
          action: 'submitBatch',
          guesses: {
            '0': { playerId: 10, isCorrect: true },
            '1': { playerId: 20, isCorrect: false }, // Ignored
          },
        },
        'user-42'
      );

      expect(result.success).toBe(true);
      expect(result.results.length).toBe(1);
      expect(result.results[0].cellIndex).toBe(0);
    });
  });

  describe('getOrCreateDailyChallenge', () => {
    it('returns existing challenge if already in DB', async () => {
      const existing = { id: 'ch-today', gameDate: '2026-05-18' };
      repositoryMock.findChallengeByDate.mockResolvedValue(existing);

      const challenge = await service.getOrCreateDailyChallenge('2026-05-18');
      expect(challenge).toBe(existing);
      expect(repositoryMock.insertChallengeSafely).not.toHaveBeenCalled();
    });
  });
});

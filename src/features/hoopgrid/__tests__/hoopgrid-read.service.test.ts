import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HoopgridReadService } from '../server/services/hoopgrid-read.service';
import { HoopgridRepository } from '../server/repositories/hoopgrid.repository';
import { HoopgridCommandService } from '../server/services/hoopgrid-command.service';
import { HoopgridValidationError } from '../validation/hoopgrid.schema';

vi.mock('@/lib/db/season-context', () => ({
  resolveReadSeasonId: vi.fn(async () => '2025-2026'),
}));

describe('HoopgridReadService', () => {
  let repositoryMock: Partial<Record<keyof HoopgridRepository, any>>;
  let commandServiceMock: Partial<Record<keyof HoopgridCommandService, any>>;
  let service: HoopgridReadService;

  beforeEach(() => {
    repositoryMock = {
      findChallengeByDate: vi.fn(),
      findChallengeById: vi.fn(),
      listChallenges: vi.fn(),
      insertChallengeSafely: vi.fn(),
      getUserGuesses: vi.fn(async () => []),
      getRarity: vi.fn(async () => 12),
      getSeasonFullData: vi.fn(),
    };

    commandServiceMock = {
      calculateComplexity: vi.fn(() => 45),
      getOrCreateDailyChallenge: vi.fn(),
    };

    service = new HoopgridReadService(
      repositoryMock as unknown as HoopgridRepository,
      commandServiceMock as unknown as HoopgridCommandService
    );
  });

  describe('getTodayChallenge', () => {
    it('validates date parameter and throws on malformed date', async () => {
      await expect(service.getTodayChallenge('not-a-date')).rejects.toThrow(
        HoopgridValidationError
      );
    });

    it('returns existing challenge mapped with complexity and user guesses', async () => {
      repositoryMock.findChallengeByDate.mockResolvedValue({
        id: 'ch-1',
        gameDate: '2026-05-18',
        number: 5,
        rows: JSON.stringify([{ type: 'pos', value: 'Base', label: 'Base' }]),
        cols: JSON.stringify([{ type: 'country', value: 'Spain', label: 'Spain' }]),
        possibleCounts: JSON.stringify([10]),
        isActive: true,
      });

      repositoryMock.getUserGuesses.mockResolvedValue([
        {
          cellIndex: 0,
          playerId: 15,
          isCorrect: true,
          playerName: 'Ricky Rubio',
          playerImg: 'rubio.png',
        },
      ]);

      const result = await service.getTodayChallenge('2026-05-18', 'user-42');

      expect(result.challenge.id).toBe('ch-1');
      expect(result.challenge.complexity).toBe(45);
      expect(result.challenge.rows).toEqual([{ type: 'pos', value: 'Base', label: 'Base' }]);
      expect(result.userGuesses.length).toBe(1);
      expect(result.userGuesses[0].rarity).toBe(12);
      expect(result.userGuesses[0].isCorrect).toBe(true);
    });

    it('triggers getOrCreateDailyChallenge if no challenge exists for date', async () => {
      repositoryMock.findChallengeByDate.mockResolvedValue(null);
      commandServiceMock.getOrCreateDailyChallenge.mockResolvedValue({
        id: 'new-ch',
        gameDate: '2026-05-18',
        number: 6,
        rows: '[]',
        cols: '[]',
        possibleCounts: '[]',
        isActive: true,
      });

      const result = await service.getTodayChallenge('2026-05-18');
      expect(commandServiceMock.getOrCreateDailyChallenge).toHaveBeenCalledWith(
        '2026-05-18',
        expect.any(Number)
      );
      expect(result.challenge.id).toBe('new-ch');
    });
  });

  describe('listChallenges', () => {
    it('returns all challenges mapped with calculated complexity', async () => {
      repositoryMock.listChallenges.mockResolvedValue([
        {
          id: 'ch-1',
          gameDate: '2026-05-18',
          number: 5,
          possibleCounts: '[5]',
        },
        {
          id: 'ch-2',
          gameDate: '2026-05-17',
          number: 4,
          possibleCounts: '[10]',
        },
      ]);

      const result = await service.listChallenges();
      expect(result.challenges.length).toBe(2);
      expect(result.challenges[0].complexity).toBe(45);
    });
  });

  describe('getCheatsheetData', () => {
    it('returns null if challenge is not found', async () => {
      repositoryMock.findChallengeByDate.mockResolvedValue(null);
      repositoryMock.listChallenges.mockResolvedValue([]);

      const result = await service.getCheatsheetData('2026-05-18');
      expect(result).toBeNull();
    });

    it('solves 3x3 cells and sorts candidate players by price descending', async () => {
      const rows = [
        { type: 'pos', value: 'Base', label: 'Base' },
        { type: 'pos', value: 'Alero', label: 'Alero' },
        { type: 'pos', value: 'Pivot', label: 'Pivot' },
      ];
      const cols = [
        { type: 'country', value: 'Spain', label: 'Spain' },
        { type: 'country', value: 'France', label: 'France' },
        { type: 'country', value: 'Serbia', label: 'Serbia' },
      ];

      repositoryMock.findChallengeByDate.mockResolvedValue({
        id: 'ch-1',
        gameDate: '2026-05-18',
        number: 5,
        rows: JSON.stringify(rows),
        cols: JSON.stringify(cols),
        possibleCounts: JSON.stringify(Array(9).fill(1)),
        isActive: true,
      });

      repositoryMock.listChallenges.mockResolvedValue([]);

      repositoryMock.getSeasonFullData.mockResolvedValue({
        allPlayers: [
          { id: 1, name: 'Player Expensive', position: 'Base', country: 'Spain', price: 15000000 },
          { id: 2, name: 'Player Cheap', position: 'Base', country: 'Spain', price: 3000000 },
          { id: 3, name: 'French Forward', position: 'Alero', country: 'France', price: 8000000 },
        ],
        allStats: [],
        allInitial: [],
        allFichajes: [],
        allUsersList: [],
      });

      const result = await service.getCheatsheetData('2026-05-18');

      expect(result).not.toBeNull();
      expect(result!.solutions.length).toBe(9);

      // Cell 0 is Base (rows[0]) x Spain (cols[0])
      const cell0 = result!.solutions[0];
      expect(cell0.rowLabel).toBe('Base');
      expect(cell0.colLabel).toBe('Spain');
      expect(cell0.players.length).toBe(2);
      expect(cell0.players[0].name).toBe('Player Expensive');
      expect(cell0.players[1].name).toBe('Player Cheap');

      // Cell 4 is Alero (rows[1]) x France (cols[1])
      const cell4 = result!.solutions[4];
      expect(cell4.players.length).toBe(1);
      expect(cell4.players[0].name).toBe('French Forward');
    });
  });
});

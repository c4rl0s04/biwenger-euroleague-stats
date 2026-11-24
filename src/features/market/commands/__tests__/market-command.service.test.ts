import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createMarketCommandService,
  MarketCommandService,
} from '../server/services/market-command.service';
import type { MarketCommandRepository } from '../server/repositories/market-command.repository';
import { MarketCommandValidationError } from '../validation/market-command.schema';
import {
  BiwengerMutationError,
  BiwengerRateLimitError,
  type BiwengerRequestContext,
} from '@/features/provider/server';

const mockExecuteUserProviderCommand = vi.fn();

vi.mock('@/features/provider/server', async () => {
  const actual = await vi.importActual<any>('@/features/provider/server');
  return {
    ...actual,
    executeUserProviderCommand: (...args: any[]) => mockExecuteUserProviderCommand(...args),
  };
});

describe('Market Command Service', () => {
  let repository: MarketCommandRepository;
  let service: MarketCommandService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = {
      clearLocalPlayerOwner: vi.fn().mockResolvedValue(undefined),
      capturePlayerOwnership: vi.fn().mockResolvedValue({ seasonId: '2026-27', version: '12' }),
      clearConfirmedPlayerOwner: vi.fn().mockResolvedValue(true),
    };
    service = createMarketCommandService(repository);
  });

  describe('sellPlayer', () => {
    it('executes regular sell command without calling local DB repository', async () => {
      mockExecuteUserProviderCommand.mockImplementation(
        async (_userId: string, operation: string, callback: any) => {
          expect(operation).toBe('market.place');
          const client = { command: vi.fn().mockResolvedValue({ status: 200 }) };
          const context: BiwengerRequestContext = {
            userId: 'user-1',
          };
          return callback(client, context);
        }
      );

      const result = await service.sellPlayer('user-1', {
        playerId: 101,
        price: 3500000,
        type: 'sell',
      });

      expect(result).toEqual({
        status: 'completed',
        playerId: 101,
        mode: 'sell',
        message: 'Jugador procesado en el mercado correctamente',
      });
      expect(repository.clearLocalPlayerOwner).not.toHaveBeenCalled();
    });

    it('executes immediateSell command and clears local player owner in DB', async () => {
      mockExecuteUserProviderCommand.mockImplementation(
        async (_userId: string, _operation: string, callback: any) => {
          const client = { command: vi.fn().mockResolvedValue({ status: 200 }) };
          const context: BiwengerRequestContext = {
            userId: 'user-1',
          };
          return callback(client, context);
        }
      );

      const result = await service.sellPlayer('user-1', {
        playerId: 202,
        price: 2000000,
        type: 'immediateSell',
      });

      expect(result).toEqual({
        status: 'completed',
        playerId: 202,
        mode: 'immediateSell',
        message: 'Jugador procesado en el mercado correctamente',
      });
      expect(repository.clearLocalPlayerOwner).toHaveBeenCalledWith(202, 'user-1');
    });

    it('catches and logs local DB failure on immediateSell without throwing', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(repository.clearLocalPlayerOwner).mockRejectedValueOnce(
        new Error('DB connection pool full')
      );

      mockExecuteUserProviderCommand.mockImplementation(
        async (_userId: string, _operation: string, callback: any) => {
          const client = { command: vi.fn().mockResolvedValue({ status: 200 }) };
          const context: BiwengerRequestContext = {
            userId: 'user-1',
          };
          return callback(client, context);
        }
      );

      const result = await service.sellPlayer('user-1', {
        playerId: 303,
        price: 1500000,
        type: 'immediateSell',
      });

      expect(result.status).toBe('completed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update player owner in DB after immediate sell'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('throws when userId is missing', async () => {
      await expect(service.sellPlayer('', { playerId: 1, price: 100 })).rejects.toThrow(
        'User ID is required'
      );
    });

    it('throws MarketCommandValidationError on invalid input schema before provider call', async () => {
      await expect(service.sellPlayer('user-1', { playerId: -1, price: 100 })).rejects.toThrow(
        MarketCommandValidationError
      );
      expect(mockExecuteUserProviderCommand).not.toHaveBeenCalled();
    });

    it('propagates BiwengerRateLimitError intact', async () => {
      mockExecuteUserProviderCommand.mockRejectedValue(
        new BiwengerRateLimitError('/market', 30000)
      );

      await expect(service.sellPlayer('user-1', { playerId: 1, price: 100 })).rejects.toThrow(
        BiwengerRateLimitError
      );
    });
  });

  describe('sellAllSquad', () => {
    it('executes sellAllSquad command with team type', async () => {
      mockExecuteUserProviderCommand.mockImplementation(
        async (_userId: string, operation: string, callback: any) => {
          expect(operation).toBe('market.place-team');
          const client = { command: vi.fn().mockResolvedValue({ status: 200 }) };
          const context: BiwengerRequestContext = {
            userId: 'user-1',
          };
          return callback(client, context);
        }
      );

      const result = await service.sellAllSquad('user-1', { pricePercentage: 90 });
      expect(result).toEqual({
        status: 'completed',
        message: 'Plantilla entera puesta en mercado',
      });
    });

    it('throws when userId is missing', async () => {
      await expect(service.sellAllSquad('', {})).rejects.toThrow('User ID is required');
    });
  });

  describe('withdrawPlayer', () => {
    it('executes DELETE request to withdraw player from market', async () => {
      let executedPath = '';
      let executedMethod = '';

      mockExecuteUserProviderCommand.mockImplementation(
        async (_userId: string, operation: string, callback: any) => {
          expect(operation).toBe('market.withdraw');
          const client = {
            command: vi.fn().mockImplementation((path, options) => {
              executedPath = path;
              executedMethod = options.method;
              return Promise.resolve({ status: 200 });
            }),
          };
          const context: BiwengerRequestContext = {
            userId: 'user-1',
          };
          return callback(client, context);
        }
      );

      const result = await service.withdrawPlayer('user-1', { playerId: 404 });
      expect(result).toEqual({
        status: 'completed',
        playerId: 404,
        message: 'Jugador retirado del mercado correctamente',
      });
      expect(executedPath).toBe('/market?player=404');
      expect(executedMethod).toBe('DELETE');
    });
  });

  describe('acceptOffer', () => {
    const query = vi.fn();
    const command = vi.fn();
    beforeEach(() => {
      query.mockReset().mockResolvedValueOnce({
        data: {
          players: [{ id: 888 }],
          offers: [{ id: 555, requestedPlayers: [888], status: 'waiting' }],
        },
      });
      command.mockReset().mockResolvedValue({ status: 200 });
      mockExecuteUserProviderCommand.mockImplementation(async (actor, operation, run) => {
        expect(actor).toBe('user-1');
        expect(operation).toBe('offer.accept');
        return run({ query, command }, { userId: actor });
      });
    });

    it('derives the player from the live offer and clears only confirmed seller ownership', async () => {
      query.mockResolvedValueOnce({ data: { players: [] } });
      await expect(service.acceptOffer('user-1', { offerId: 555 })).resolves.toMatchObject({
        status: 'completed',
        offerId: 555,
        playerId: 888,
        ownership: 'departed',
        history: 'pending',
      });
      expect(command).toHaveBeenCalledExactlyOnceWith('/offers/555', {
        method: 'PUT',
        body: { status: 'accepted' },
        context: { userId: 'user-1' },
      });
      expect(query).toHaveBeenLastCalledWith('/user?fields=players(id)', {
        cache: 'no-store',
        context: { userId: 'user-1' },
      });
      expect(repository.clearConfirmedPlayerOwner).toHaveBeenCalledExactlyOnceWith(888, 'user-1', {
        seasonId: '2026-27',
        version: '12',
      });
    });

    it('rejects a browser player ID that does not match the current offer', async () => {
      await expect(
        service.acceptOffer('user-1', { offerId: 555, playerId: 999 })
      ).rejects.toBeInstanceOf(MarketCommandValidationError);
      expect(command).not.toHaveBeenCalled();
      expect(repository.clearConfirmedPlayerOwner).not.toHaveBeenCalled();
    });

    it.each(['still-owned', 'failed-read', 'incomplete-read'])(
      'preserves the last known owner on %s and does not send the command again',
      async (scenario) => {
        if (scenario === 'failed-read') query.mockRejectedValueOnce(new Error('read timeout'));
        else
          query.mockResolvedValueOnce({
            data: scenario === 'still-owned' ? { players: [{ id: 888 }] } : {},
          });
        const log = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
          await expect(
            service.acceptOffer('user-1', { offerId: 555, playerId: 888 })
          ).resolves.toMatchObject({
            status: 'completed',
            ownership: 'pending',
            history: 'pending',
          });
          expect(command).toHaveBeenCalledOnce();
          expect(repository.clearConfirmedPlayerOwner).not.toHaveBeenCalled();
        } finally {
          log.mockRestore();
        }
      }
    );
  });

  describe('rejectOffer', () => {
    it('rejects offer via PUT request with status rejected', async () => {
      let requestBody: any;

      mockExecuteUserProviderCommand.mockImplementation(
        async (_userId: string, operation: string, callback: any) => {
          expect(operation).toBe('offer.reject');
          const client = {
            command: vi.fn().mockImplementation((_path, options) => {
              requestBody = options.body;
              return Promise.resolve({ status: 200 });
            }),
          };
          const context: BiwengerRequestContext = {
            userId: 'user-1',
          };
          return callback(client, context);
        }
      );

      const result = await service.rejectOffer('user-1', { offerId: 666 });
      expect(result).toEqual({
        status: 'completed',
        offerId: 666,
        message: 'Oferta rechazada correctamente',
      });
      expect(requestBody).toEqual({ status: 'rejected' });
    });
  });
});

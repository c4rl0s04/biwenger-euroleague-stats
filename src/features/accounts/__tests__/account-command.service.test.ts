import { describe, expect, it, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import {
  AccountCommandService,
  AccountNotFoundError,
  AccountProviderAuthError,
  AccountStorageError,
} from '../server/services/account-command.service';
import { AccountValidationError } from '../validation/account-command.schema';
import type { AccountRepository } from '../server/repositories/account.repository';

describe('AccountCommandService', () => {
  let mockRepo: {
    getUserById: ReturnType<typeof vi.fn>;
    getUserWithPassword: ReturnType<typeof vi.fn>;
    updateUserPassword: ReturnType<typeof vi.fn>;
    storeBiwengerCredential: ReturnType<typeof vi.fn>;
  };
  let mockFetch: ReturnType<typeof vi.fn>;
  let service: AccountCommandService;

  beforeEach(() => {
    mockRepo = {
      getUserById: vi.fn(),
      getUserWithPassword: vi.fn(),
      updateUserPassword: vi.fn(),
      storeBiwengerCredential: vi.fn(),
    };
    mockFetch = vi.fn();
    service = new AccountCommandService(mockRepo as unknown as AccountRepository, mockFetch as unknown as typeof fetch);
  });

  describe('changePassword', () => {
    it('successfully changes password when current password matches', async () => {
      const hashedCurrent = await bcrypt.hash('correctOldPassword', 10);
      mockRepo.getUserWithPassword.mockResolvedValue({
        id: 'user-1',
        password: hashedCurrent,
      });

      const result = await service.changePassword('user-1', {
        currentPassword: 'correctOldPassword',
        newPassword: 'newSecurePassword456',
      });

      expect(result).toEqual({ message: 'Contraseña actualizada correctamente' });
      expect(mockRepo.updateUserPassword).toHaveBeenCalledTimes(1);
      const updatedHash = mockRepo.updateUserPassword.mock.calls[0][1];
      expect(await bcrypt.compare('newSecurePassword456', updatedHash)).toBe(true);
    });

    it('throws AccountNotFoundError when user does not exist', async () => {
      mockRepo.getUserWithPassword.mockResolvedValue(null);

      await expect(
        service.changePassword('non-existent-user', {
          currentPassword: 'somePassword',
          newPassword: 'newPassword123',
        })
      ).rejects.toThrow(AccountNotFoundError);
      expect(mockRepo.updateUserPassword).not.toHaveBeenCalled();
    });

    it('throws AccountValidationError when current password is wrong', async () => {
      const hashedCurrent = await bcrypt.hash('realPassword', 10);
      mockRepo.getUserWithPassword.mockResolvedValue({
        id: 'user-1',
        password: hashedCurrent,
      });

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123',
        })
      ).rejects.toThrow(AccountValidationError);
      expect(mockRepo.updateUserPassword).not.toHaveBeenCalled();
    });

    it('throws AccountValidationError when stored user password is null', async () => {
      mockRepo.getUserWithPassword.mockResolvedValue({
        id: 'user-1',
        password: null,
      });

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'anyPassword',
          newPassword: 'newPassword123',
        })
      ).rejects.toThrow(AccountValidationError);
      expect(mockRepo.updateUserPassword).not.toHaveBeenCalled();
    });
  });

  describe('linkBiwenger', () => {
    it('successfully links account when credentials are valid', async () => {
      const canaryToken = 'biwenger-auth-canary-token';
      mockRepo.getUserById.mockResolvedValue({
        id: 'user-1',
        name: 'Manager 1',
        email: 'user1@example.com',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ token: canaryToken }),
      });

      const result = await service.linkBiwenger('user-1', {
        password: 'validBiwengerPassword',
      });

      expect(result).toEqual({
        message: '¡Cuenta vinculada con éxito! Tus datos se sincronizarán de forma segura.',
        status: 'linked',
        biwengerLinked: true,
      });
      expect(mockRepo.storeBiwengerCredential).toHaveBeenCalledWith(
        'user-1',
        canaryToken,
        'user1@example.com'
      );
    });

    it('uses provided email override when specified', async () => {
      const canaryToken = 'biwenger-auth-canary-token-2';
      mockRepo.getUserById.mockResolvedValue({
        id: 'user-1',
        name: 'Manager 1',
        email: 'stored@example.com',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ token: canaryToken }),
      });

      await service.linkBiwenger('user-1', {
        password: 'validPassword',
        email: 'override@example.com',
      });

      expect(mockRepo.storeBiwengerCredential).toHaveBeenCalledWith(
        'user-1',
        canaryToken,
        'override@example.com'
      );
    });

    it('throws AccountNotFoundError when user is not found', async () => {
      mockRepo.getUserById.mockResolvedValue(null);

      await expect(
        service.linkBiwenger('missing-user', {
          password: 'validPassword',
        })
      ).rejects.toThrow(AccountNotFoundError);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockRepo.storeBiwengerCredential).not.toHaveBeenCalled();
    });

    it('throws AccountValidationError when neither user nor input provides email', async () => {
      mockRepo.getUserById.mockResolvedValue({
        id: 'user-1',
        name: 'Manager 1',
        email: null,
      });

      await expect(
        service.linkBiwenger('user-1', {
          password: 'validPassword',
        })
      ).rejects.toThrow(AccountValidationError);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws AccountProviderAuthError on 401 unauthorized from Biwenger without leaking tokens', async () => {
      const canaryToken = 'sensitive-leak-token';
      mockRepo.getUserById.mockResolvedValue({
        id: 'user-1',
        email: 'u@example.com',
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ token: canaryToken, message: `Bad token: ${canaryToken}` }),
      });

      await expect(
        service.linkBiwenger('user-1', { password: 'wrongPassword' })
      ).rejects.toThrow(AccountProviderAuthError);

      expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(canaryToken);
      expect(mockRepo.storeBiwengerCredential).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('throws AccountProviderAuthError on 500 error from Biwenger', async () => {
      mockRepo.getUserById.mockResolvedValue({
        id: 'user-1',
        email: 'u@example.com',
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal provider failure' }),
      });

      try {
        await service.linkBiwenger('user-1', { password: 'somePassword' });
        expect.unreachable('Should have thrown AccountProviderAuthError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AccountProviderAuthError);
        expect(err.statusCode).toBe(502);
      }
    });

    it('throws AccountProviderAuthError when Biwenger returns 200 but no token', async () => {
      mockRepo.getUserById.mockResolvedValue({
        id: 'user-1',
        email: 'u@example.com',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ otherField: 123 }),
      });

      await expect(
        service.linkBiwenger('user-1', { password: 'somePassword' })
      ).rejects.toThrow(AccountProviderAuthError);
    });

    it('throws AccountStorageError when credential storage fails without leaking canary', async () => {
      const canaryToken = 'secret-canary-token';
      mockRepo.getUserById.mockResolvedValue({
        id: 'user-1',
        email: 'u@example.com',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ token: canaryToken }),
      });

      mockRepo.storeBiwengerCredential.mockRejectedValue(
        new Error(`storage write failure with payload ${canaryToken}`)
      );

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(
        service.linkBiwenger('user-1', { password: 'somePassword' })
      ).rejects.toThrow(AccountStorageError);

      expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(canaryToken);
      errorSpy.mockRestore();
    });
  });
});

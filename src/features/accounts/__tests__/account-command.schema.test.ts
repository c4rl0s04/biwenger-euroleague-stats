import { describe, expect, it } from 'vitest';
import {
  AccountValidationError,
  ChangePasswordInputSchema,
  LinkBiwengerInputSchema,
  parseChangePasswordInput,
  parseLinkBiwengerInput,
} from '../validation/account-command.schema';

describe('account command schemas', () => {
  describe('ChangePasswordInputSchema', () => {
    it('accepts valid password inputs', () => {
      const result = parseChangePasswordInput({
        currentPassword: 'secretCurrentPassword',
        newPassword: 'newSecurePassword123',
      });
      expect(result).toEqual({
        currentPassword: 'secretCurrentPassword',
        newPassword: 'newSecurePassword123',
      });
    });

    it('rejects empty or missing currentPassword', () => {
      expect(() =>
        parseChangePasswordInput({
          currentPassword: '',
          newPassword: 'newPassword123',
        })
      ).toThrow(AccountValidationError);

      expect(() =>
        parseChangePasswordInput({
          newPassword: 'newPassword123',
        })
      ).toThrow(AccountValidationError);
    });

    it('rejects empty or missing newPassword', () => {
      expect(() =>
        parseChangePasswordInput({
          currentPassword: 'currentPassword123',
          newPassword: '',
        })
      ).toThrow(AccountValidationError);

      expect(() =>
        parseChangePasswordInput({
          currentPassword: 'currentPassword123',
        })
      ).toThrow(AccountValidationError);
    });

    it('rejects non-object input', () => {
      expect(() => parseChangePasswordInput(null)).toThrow(AccountValidationError);
      expect(() => parseChangePasswordInput('not-an-object')).toThrow(AccountValidationError);
    });
  });

  describe('LinkBiwengerInputSchema', () => {
    it('accepts password with valid email', () => {
      const result = parseLinkBiwengerInput({
        password: 'biwengerSecretPassword',
        email: 'user@example.com',
      });
      expect(result).toEqual({
        password: 'biwengerSecretPassword',
        email: 'user@example.com',
      });
    });

    it('accepts password without email', () => {
      const result = parseLinkBiwengerInput({
        password: 'biwengerSecretPassword',
      });
      expect(result).toEqual({
        password: 'biwengerSecretPassword',
      });
    });

    it('accepts password with empty email string', () => {
      const result = parseLinkBiwengerInput({
        password: 'biwengerSecretPassword',
        email: '',
      });
      expect(result).toEqual({
        password: 'biwengerSecretPassword',
      });
    });

    it('rejects missing or empty password', () => {
      expect(() =>
        parseLinkBiwengerInput({
          email: 'user@example.com',
        })
      ).toThrow(AccountValidationError);

      expect(() =>
        parseLinkBiwengerInput({
          password: '',
        })
      ).toThrow(AccountValidationError);
    });

    it('rejects invalid email format when email is provided', () => {
      expect(() =>
        parseLinkBiwengerInput({
          password: 'somePassword',
          email: 'not-an-email',
        })
      ).toThrow(AccountValidationError);
    });
  });
});

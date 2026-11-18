import 'server-only';

import bcrypt from 'bcryptjs';
import { createBiwengerProviderClient, verifyBiwengerManager } from '@/features/provider/server';
import { CONFIG } from '@/lib/config';
import type { ChangePasswordResult, LinkBiwengerResult } from '../../models/account.models';
import {
  AccountValidationError,
  parseChangePasswordInput,
  parseLinkBiwengerInput,
} from '../../validation/account-command.schema';
import {
  AccountRepository,
  accountRepository as defaultAccountRepository,
} from '../repositories/account.repository';

export class AccountNotFoundError extends Error {
  readonly statusCode = 404;
  constructor(message: string = 'Usuario no encontrado') {
    super(message);
    this.name = 'AccountNotFoundError';
  }
}

export class AccountProviderAuthError extends Error {
  readonly statusCode: number;
  constructor(message: string = 'Credenciales de Biwenger incorrectas.', statusCode: number = 502) {
    super(message);
    this.name = 'AccountProviderAuthError';
    this.statusCode = statusCode;
  }
}

export class AccountStorageError extends Error {
  readonly statusCode = 500;
  constructor(message: string = 'Error al guardar credenciales de Biwenger.') {
    super(message);
    this.name = 'AccountStorageError';
  }
}

export class AccountCommandService {
  constructor(
    private readonly repository: AccountRepository = defaultAccountRepository,
    private readonly fetchFn?: typeof fetch
  ) {}

  private getFetch(): typeof fetch {
    return this.fetchFn ?? globalThis.fetch;
  }

  async changePassword(userId: string, input: unknown): Promise<ChangePasswordResult> {
    const { currentPassword, newPassword } = parseChangePasswordInput(input);

    const user = await this.repository.getUserWithPassword(userId);
    if (!user) {
      throw new AccountNotFoundError('Usuario no encontrado');
    }

    if (!user.password) {
      throw new AccountValidationError('La contraseña actual es incorrecta');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new AccountValidationError('La contraseña actual es incorrecta');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.repository.updateUserPassword(userId, hashedPassword);

    return {
      message: 'Contraseña actualizada correctamente',
    };
  }

  async linkBiwenger(userId: string, input: unknown): Promise<LinkBiwengerResult> {
    const { password, email: providedEmail } = parseLinkBiwengerInput(input);

    const user = await this.repository.getUserById(userId);
    if (!user) {
      throw new AccountNotFoundError('Usuario no encontrado.');
    }

    const email = providedEmail || user.email;
    if (!email) {
      throw new AccountValidationError(
        'Por favor, proporciona un email para realizar la vinculación.'
      );
    }

    const leagueId = CONFIG.API.LEAGUE_ID;
    if (!leagueId) {
      throw new AccountProviderAuthError('No se ha podido verificar la liga de Biwenger.', 502);
    }

    const fetchFn = this.getFetch();
    const biwengerRes = await fetchFn('https://biwenger.as.com/api/v2/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        'X-Client': 'pwa',
        'X-Version': '2',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!biwengerRes.ok) {
      const status =
        biwengerRes.status >= 400 && biwengerRes.status < 500 ? biwengerRes.status : 502;
      console.warn(`Biwenger link authentication failed with status ${biwengerRes.status}`);
      throw new AccountProviderAuthError('Credenciales de Biwenger incorrectas.', status);
    }

    let responseData: { token?: string; data?: { token?: string } };
    try {
      responseData = (await biwengerRes.json()) as { token?: string; data?: { token?: string } };
    } catch {
      console.warn('Biwenger link authentication returned invalid JSON payload');
      throw new AccountProviderAuthError('Error al obtener el acceso desde Biwenger.', 502);
    }

    const token = responseData.token || responseData.data?.token;
    if (typeof token !== 'string' || !token.trim()) {
      console.error('Biwenger link authentication returned no usable credential');
      throw new AccountProviderAuthError('Error al obtener el acceso desde Biwenger.', 502);
    }

    let matchesManager: boolean;
    try {
      matchesManager = await verifyBiwengerManager(createBiwengerProviderClient({ fetchFn }), {
        token,
        leagueId,
        userId: user.id,
      });
    } catch {
      console.warn('Biwenger link membership verification failed');
      throw new AccountProviderAuthError('No se ha podido verificar la cuenta de Biwenger.', 502);
    }
    if (!matchesManager) {
      throw new AccountProviderAuthError(
        'Esta cuenta de Biwenger no corresponde a tu mánager en la liga.',
        403
      );
    }

    try {
      await this.repository.storeBiwengerCredential(user.id, token);
    } catch {
      console.error('Biwenger link credential storage failure');
      throw new AccountStorageError('Error al guardar credenciales de Biwenger.');
    }

    return {
      message: '¡Cuenta vinculada con éxito! Tus datos se sincronizarán de forma segura.',
      status: 'linked',
      biwengerLinked: true,
    };
  }
}

export const accountCommandService = new AccountCommandService();

import 'server-only';

import type { AccountSettingsViewModel } from '../../models/account.models';
import {
  AccountRepository,
  accountRepository as defaultAccountRepository,
} from '../repositories/account.repository';

export class AccountReadService {
  constructor(
    private readonly repository: AccountRepository = defaultAccountRepository
  ) {}

  async getAccountSettings(
    userId: string,
    biwengerLinkedFallback: boolean = false
  ): Promise<AccountSettingsViewModel> {
    const user = await this.repository.getUserById(userId);
    return {
      id: userId,
      name: user?.name ?? null,
      email: user?.email ?? null,
      biwengerLinked: biwengerLinkedFallback,
    };
  }
}

export const accountReadService = new AccountReadService();

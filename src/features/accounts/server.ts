import 'server-only';

export {
  AccountRepository,
  accountRepository,
  type UserAccountRecord,
  type UserWithPasswordRecord,
} from './server/repositories/account.repository';

export {
  AccountCommandService,
  accountCommandService,
  AccountNotFoundError,
  AccountProviderAuthError,
  AccountStorageError,
} from './server/services/account-command.service';

export {
  AccountReadService,
  accountReadService,
} from './server/services/account-read.service';

export {
  AccountValidationError,
  ChangePasswordInputSchema,
  LinkBiwengerInputSchema,
  parseChangePasswordInput,
  parseLinkBiwengerInput,
} from './validation/account-command.schema';

export type {
  AccountSettingsViewModel,
  ChangePasswordInput,
  ChangePasswordResult,
  LinkBiwengerInput,
  LinkBiwengerResult,
} from './models/account.models';

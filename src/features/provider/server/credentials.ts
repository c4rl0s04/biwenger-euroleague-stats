import type { BiwengerRequestContext, ProviderCommandResult } from './types';
import { biwengerProviderClient, BiwengerProviderClient } from './client';

export async function executeUserProviderQuery<T>(
  userId: string,
  operation: string,
  queryRunner: (client: BiwengerProviderClient, context: BiwengerRequestContext) => Promise<T>,
  client: BiwengerProviderClient = biwengerProviderClient
): Promise<T> {
  const { biwengerCredentials } = await import('@/lib/credentials/service');
  return biwengerCredentials.withCredential(userId, operation, async (credential) => {
    const context: BiwengerRequestContext = {
      token: credential,
      userId,
    };
    return queryRunner(client, context);
  });
}

export async function executeUserProviderCommand(
  userId: string,
  operation: string,
  commandRunner: (
    client: BiwengerProviderClient,
    context: BiwengerRequestContext
  ) => Promise<ProviderCommandResult>,
  client: BiwengerProviderClient = biwengerProviderClient
): Promise<ProviderCommandResult> {
  const { biwengerCredentials } = await import('@/lib/credentials/service');
  return biwengerCredentials.withCredential(userId, operation, async (credential) => {
    const context: BiwengerRequestContext = {
      token: credential,
      userId,
    };
    return commandRunner(client, context);
  });
}

import { getRequestSeason } from '@/lib/seasons/server';
import type { BiwengerRequestContext, ProviderCommandResult } from './types';
import { biwengerProviderClient, BiwengerProviderClient } from './client';

export async function executeUserProviderQuery<T>(
  userId: string,
  operation: string,
  queryRunner: (client: BiwengerProviderClient, context: BiwengerRequestContext) => Promise<T>,
  client: BiwengerProviderClient = biwengerProviderClient
): Promise<T> {
  const season = await getRequestSeason();
  if (season.status !== 'active')
    throw new Error('Live provider operations require the active season.');
  const leagueId = season.sourceLeagueId;
  if (!leagueId) throw new Error('Active season has no Biwenger league binding.');
  const { biwengerCredentials } = await import('@/lib/credentials/server');
  return biwengerCredentials.withCredential(userId, operation, async (credential) => {
    const context: BiwengerRequestContext = {
      token: credential,
      leagueId,
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
  const season = await getRequestSeason();
  if (season.status !== 'active')
    throw new Error('Live provider operations require the active season.');
  const leagueId = season.sourceLeagueId;
  if (!leagueId) throw new Error('Active season has no Biwenger league binding.');
  const { biwengerCredentials } = await import('@/lib/credentials/server');
  return biwengerCredentials.withCredential(userId, operation, async (credential) => {
    const context: BiwengerRequestContext = {
      token: credential,
      leagueId,
      userId,
    };
    return commandRunner(client, context);
  });
}

import { z } from 'zod';
import { fetchLeague } from '../../../api/biwenger-client';
import { prepareUserMutations, type UserMutations } from '../../../db/mutations/users';
import type { SyncManager } from '../../manager';

const member = z.object({
  id: z.union([z.int().positive(), z.string().regex(/^[1-9]\d*$/)]),
  name: z.string().refine((name) => name.trim().length > 0 && !name.includes('\0')),
  icon: z
    .string()
    .refine((icon) => !icon.includes('\0'))
    .nullish(),
});

const leagueStandings = z.object({ data: z.object({ standings: z.array(member).min(1) }) });

export interface UsersDependencies {
  fetchLeague?: () => Promise<unknown>;
  prepareMutations?: (db: unknown, options: { seasonId: string }) => UserMutations;
}

/**
 * Syncs league standings (users) to the local database.
 */
export async function syncBiwengerUsers(
  manager: SyncManager,
  dependencies: UsersDependencies = {}
) {
  const db = manager.context.db;
  const seasonId = manager.context.seasonId;
  if (!seasonId) {
    throw new Error('Canonical sync season was not resolved before user ingestion.');
  }

  manager.log('Fetching standings');
  const getLeague = dependencies.fetchLeague || fetchLeague;
  const mutationsFactory = dependencies.prepareMutations || prepareUserMutations;

  try {
    const league = leagueStandings.safeParse(await getLeague());
    if (!league.success) throw new Error('Biwenger returned empty or invalid league standings.');
    const { standings } = league.data.data;

    const mutations = mutationsFactory(db as any, { seasonId });
    const activeUserIds: string[] = [];

    for (const user of standings) {
      activeUserIds.push(user.id.toString());
      await mutations.upsertUser({
        id: user.id.toString(),
        name: user.name,
        icon: user.icon ? `https://cdn.biwenger.com/${user.icon}` : null,
      });
    }
    await mutations.markSeasonUsersInactiveExcept(activeUserIds);

    return {
      summary: 'Biwenger league users synchronized.',
      counts: { users: standings.length },
    };
  } catch (err) {
    throw new Error('Failed to synchronize Biwenger users.', { cause: err });
  }
}

/** Compatibility export */
export const run = syncBiwengerUsers;

import { z } from 'zod';
import type { BiwengerProviderClient } from './client';

const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const accountMemberships = z.object({
  status: z.literal(200),
  data: z.object({
    leagues: z.array(z.object({ id, user: z.object({ id }) })),
  }),
});

export async function verifyBiwengerManager(
  client: BiwengerProviderClient,
  { token, leagueId, userId }: { token: string; leagueId: string; userId: string }
): Promise<boolean> {
  const response: unknown = await client.query(
    '/account',
    { skipVersionCheck: true, cache: 'no-store', delayMs: 0, retries: 0 },
    { token, leagueId, userId }
  );
  const account = accountMemberships.parse(response);
  const matches = account.data.leagues.filter((league) => String(league.id) === leagueId);
  return matches.length === 1 && String(matches[0].user.id) === userId;
}

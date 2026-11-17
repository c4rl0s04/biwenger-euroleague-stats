import 'server-only';

import { z } from 'zod';
import { BiwengerProviderClient } from './client';
import type { BiwengerRequestContext } from './types';

const identity = z
  .union([z.string().regex(/^[1-9]\d*$/), z.number().int().positive().safe()])
  .transform(String);
const accountSchema = z.object({
  data: z.object({
    leagues: z.array(z.object({ id: identity, user: z.object({ id: identity }) })),
  }),
});

export async function resolveIngestionContext(
  leagueId: string,
  client = new BiwengerProviderClient(),
  token = process.env.BIWENGER_TOKEN
): Promise<BiwengerRequestContext> {
  if (!token?.trim()) throw new Error('BIWENGER_TOKEN is required for ingestion.');
  const result = accountSchema.safeParse(
    await client.query('/account', { skipVersionCheck: true, cache: 'no-store' }, { token })
  );
  if (!result.success) throw new Error('Invalid Biwenger account membership response.');
  const matches = result.data.data.leagues.filter((league) => league.id === leagueId);
  if (matches.length !== 1)
    throw new Error(
      'Biwenger account must have exactly one membership in the selected season league.'
    );
  return { token, leagueId, userId: matches[0].user.id };
}

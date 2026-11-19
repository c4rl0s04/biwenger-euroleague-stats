import { z } from 'zod';
import { CONFIG } from '@/lib/config';
import { biwengerProviderClient } from './client';

const providerId = z.number().int().min(1).max(2_147_483_647);
const report = z.object({
  player: z.object({ id: providerId }),
  points: z.number().int().min(-2_147_483_648).max(2_147_483_647).nullish(),
});
const side = z.object({
  id: providerId.nullish(),
  reports: z.union([z.array(report), z.record(z.string(), report)]).nullish(),
});
const game = z.object({
  id: providerId.optional(),
  date: z.union([z.number(), z.string()]).nullish(),
  home: side.nullish(),
  away: side.nullish(),
});
const roundGames = z.object({ games: z.array(game) });
const envelope = z.object({ data: z.unknown().optional() });

export type BiwengerRoundGame = z.infer<typeof game>;

export function parseBiwengerRoundGames(payload: unknown): BiwengerRoundGame[] {
  const outer = envelope.safeParse(payload);
  const result = roundGames.safeParse(outer.success ? (outer.data.data ?? payload) : payload);
  if (!result.success) {
    throw new Error('Invalid Biwenger round games response.');
  }
  return result.data.games;
}

export async function readBiwengerRoundGames(roundId: number): Promise<BiwengerRoundGame[]> {
  const payload: unknown = await biwengerProviderClient.query(
    CONFIG.ENDPOINTS.BIWENGER.ROUND_GAMES(roundId)
  );
  return parseBiwengerRoundGames(payload);
}

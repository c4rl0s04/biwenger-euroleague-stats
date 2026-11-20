import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { z } from 'zod';

const seasonIdSchema = z.string().regex(/^\d{4}-\d{2}$/);
const playoffInputSchema = z.object({
  seasonId: seasonIdSchema,
  predictions: z.array(
    z.object({
      userId: z.string(),
      stage: z.string(),
      matchId: z.string(),
      predictedWinnerId: z.number().int().nullish(),
      predictedWinnerName: z.string().nullish(),
      predictionDetails: z.string().nullish(),
    })
  ),
  media: z.array(z.unknown()),
  results: z
    .array(
      z.object({
        matchId: z.string(),
        stage: z.string().nullish(),
        winnerName: z.string().nullish(),
        score: z.string().nullish(),
        isCompleted: z.boolean().nullish(),
      })
    )
    .nullish(),
});

export function loadPlayoffImport(
  args: string[],
  dataDirectory = fileURLToPath(new URL('./playoff-data/', import.meta.url))
) {
  const { values } = parseArgs({ args, options: { season: { type: 'string' } } });
  const target = seasonIdSchema.safeParse(values.season);
  if (!target.success) {
    throw new Error('Pass --season YYYY-YY to select the playoff import season.');
  }

  const input = playoffInputSchema.parse(
    JSON.parse(readFileSync(join(dataDirectory, `${target.data}.json`), 'utf8'))
  );
  if (input.seasonId !== target.data) {
    throw new Error(
      `Playoff input declares ${input.seasonId}; requested season is ${target.data}.`
    );
  }

  return input;
}

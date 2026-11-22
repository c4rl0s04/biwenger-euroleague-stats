import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { EuroleagueClient } from '../../../../api/euroleague/client';

const readJson = (relative: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8'));

// E2025 (2025-26): last RS game plus every play-in, playoff and Final Four game.
export const scheduleRows: Record<string, unknown>[] = readJson(
  '../../../../api/__fixtures__/advanced/schedule-postseason.json'
);
export const reportRows: Record<string, unknown>[] = readJson(
  '../../../../api/__fixtures__/advanced/report-postseason.json'
);

/** Real client over the PR0 fixtures; records which game reports were requested. */
export function fixtureProvider(schedule = scheduleRows) {
  const reportRequests: number[] = [];
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (url.pathname.includes('games/report/game')) {
      const gameCode = Number(url.searchParams.get('gamecode'));
      reportRequests.push(gameCode);
      return new Response(JSON.stringify(reportRows.filter((row) => row.Gamecode === gameCode)));
    }
    return new Response(JSON.stringify(schedule));
  }) as typeof fetch;
  return { provider: new EuroleagueClient({ fetchImpl, retries: 0 }), reportRequests };
}

export function fixtureManager(db: unknown, provider: EuroleagueClient) {
  return {
    context: {
      db,
      seasonId: '2025-26',
      season: { seasonId: '2025-26', euroleagueCode: 'E2025' },
      euroleague: provider,
    },
    log: () => {},
  } as any;
}
